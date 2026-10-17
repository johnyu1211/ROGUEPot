import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { BattleAnimationOptions, renderBattleMoveGif } from "./battleGifRenderer.js";

export interface SequenceMoveItem extends BattleAnimationOptions {
  moveNum?: number;
  moveNameKo?: string;
}

export interface SequenceMoveTiming {
  moveKey: string;
  moveNum: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  startFrame: number;
  endFrame: number;
  meStartFrame?: number;
  enimStartFrame?: number;
  meStartSec?: number;
  enimStartSec?: number;
  totalSec?: number;
  formattedSegment?: string;
}

export interface SequenceVideoOutput {
  buffer: Buffer;
  timings: SequenceMoveTiming[];
  totalDurationSec: number;
  formattedFilename: string;
}

export interface SequenceVideoOptions {
  moves: SequenceMoveItem[];
  fps?: number;
  width?: number;
  height?: number;
  renderScale?: number;
  ffmpegPath?: string;
  onProgress?: (currentMoveIdx: number, totalMoves: number, stage: string) => void;
}

export interface ShortsMoveInfo {
  num: number;
  ko: string;
  en: string;
  type: string;
  class: string;
  power: number | null;
  acc: number | null;
  pp: number | null;
}

export interface ShortsVideoOptions extends SequenceVideoOptions {
  movesInfo: ShortsMoveInfo[];
  startNum: number;
  endNum: number;
}

/**
 * Locate ffmpeg executable on system (checks PATH and common Windows winget installation)
 */
export function getFfmpegExecutable(): string {
  const customPath = process.env.FFMPEG_PATH;
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  // Windows Winget Gyan.FFmpeg default path check
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    if (localAppData) {
      const wingetGyanPattern = path.join(
        localAppData,
        "Microsoft",
        "WinGet",
        "Packages",
        "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
      );
      if (fs.existsSync(wingetGyanPattern)) {
        try {
          const subdirs = fs.readdirSync(wingetGyanPattern);
          for (const sd of subdirs) {
            const candidate = path.join(wingetGyanPattern, sd, "bin", "ffmpeg.exe");
            if (fs.existsSync(candidate)) {
              return candidate;
            }
          }
        } catch {}
      }
    }
  }

  return "ffmpeg";
}

/**
 * Seamlessly compiles a sequence of battle moves into a single continuous MP4 video.
 *
 * Key Design Features:
 * 1. Zero loading blur frames between moves or at start ("로딩 장면 없이 바로바로 다음 기술 view 연출")
 * 2. Ultra-snappy Turn 1 -> Turn 2 transition ("나 시전 > 상대시전 더 빨리되게")
 * 3. 30 FPS pixel-perfect 1:1 crisp H.264 yuv420p MP4 encoding with faststart
 * 4. Automatic cleanup of temp buffers and process error handling
 * 5. Dynamic timestamp generation for each move (e.g. No189_me_0s_enim_2s_total_4s_No190_me_4s_enim_6s_total_8s.mp4)
 */
export async function renderBattleMovesSequenceVideo(options: SequenceVideoOptions): Promise<SequenceVideoOutput> {
  const fps = options.fps || 30;
  const width = options.width || 560;
  const height = options.height || 380;
  const renderScale = options.renderScale !== undefined ? options.renderScale : 1.0;
  const ffmpegCmd = options.ffmpegPath || getFfmpegExecutable();

  const tempOutputFile = path.join(
    os.tmpdir(),
    `roguepot_seq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`
  );

  return new Promise(async (resolve, reject) => {
    let ffmpeg: any = null;
    let ffmpegErr = "";

    try {
      ffmpeg = spawn(ffmpegCmd, [
        "-y",
        "-f", "rawvideo",
        "-pix_fmt", "rgba",
        "-s", `${width}x${height}`,
        "-r", `${fps}`,
        "-i", "-",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        tempOutputFile,
      ]);
    } catch (e: any) {
      return reject(new Error(`Failed to spawn FFmpeg (${ffmpegCmd}): ${e.message}`));
    }

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      ffmpegErr += chunk.toString();
    });

    ffmpeg.on("error", (err: any) => {
      reject(new Error(`FFmpeg error: ${err.message}`));
    });

    const movesCount = options.moves.length;
    const timings: SequenceMoveTiming[] = [];
    let currentTotalFrames = 0;
    let lastGlobalSec = 0;

    try {
      for (let mIdx = 0; mIdx < movesCount; mIdx++) {
        const isLastMove = (mIdx === movesCount - 1);
        const moveOpt = options.moves[mIdx];
        const moveStartFrame = currentTotalFrames;
        let moveMeStartFrame: number | undefined = undefined;
        let moveEnimStartFrame: number | undefined = undefined;
        const orderOfActors: ("me" | "enim")[] = [];

        if (options.onProgress) {
          options.onProgress(mIdx + 1, movesCount, `기술 렌더링 (${mIdx + 1}/${movesCount}): ${moveOpt.moveKey || 'move'}`);
        }

        await renderBattleMoveGif({
          ...moveOpt,
          renderScale,
          skipGifEncoding: true,
          skipLeadingBlur: true,        // "로딩 장면 없이"
          fastTurnTransition: true,     // "나 시전 > 상대시전 더 빨리되게"
          finalHoldDelay: isLastMove ? 600 : 250, // 다음 기술로 즉시 매끄러운 250ms 전환, 마지막 기술은 600ms 홀드
          onRenderFrame: async (canvas: any, ctx: any, delay: number, frame: any) => {
            if (frame?.actionActor === "me" && moveMeStartFrame === undefined) {
              moveMeStartFrame = currentTotalFrames;
              orderOfActors.push("me");
            } else if (frame?.actionActor === "enim" && moveEnimStartFrame === undefined) {
              moveEnimStartFrame = currentTotalFrames;
              orderOfActors.push("enim");
            }

            const imgData = ctx.getImageData(0, 0, width, height);
            const rawBuf = Buffer.from(imgData.data.buffer, imgData.data.byteOffset, imgData.data.byteLength);
            const repeatCount = Math.max(1, Math.round(delay / (1000 / fps)));

            currentTotalFrames += repeatCount;

            for (let r = 0; r < repeatCount; r++) {
              const ok = ffmpeg.stdin.write(rawBuf);
              if (!ok) {
                await new Promise((res) => ffmpeg.stdin.once("drain", res));
              }
            }
          },
        });

        const moveEndFrame = currentTotalFrames;
        const startSec = Number((moveStartFrame / fps).toFixed(1));
        let endSec = Number((moveEndFrame / fps).toFixed(1));
        if (endSec <= startSec) endSec = Number((startSec + 0.1).toFixed(1));

        // Fallback actor detection if not captured via frame tags
        if (orderOfActors.length === 0) {
          const turnActions = (moveOpt.battle as any)?.turnActions;
          if (Array.isArray(turnActions) && turnActions.length > 0) {
            for (const act of turnActions) {
              const actKey: "me" | "enim" = act.actor === "enemy" ? "enim" : "me";
              if (!orderOfActors.includes(actKey)) {
                orderOfActors.push(actKey);
              }
            }
          }
          if (orderOfActors.length === 0) {
            orderOfActors.push("me");
          }
          if (orderOfActors.includes("me") && moveMeStartFrame === undefined) {
            moveMeStartFrame = moveStartFrame;
          }
        }

        let meSec = moveMeStartFrame !== undefined ? Number((moveMeStartFrame / fps).toFixed(1)) : undefined;
        let enimSec = moveEnimStartFrame !== undefined ? Number((moveEnimStartFrame / fps).toFixed(1)) : undefined;
        let totalSec = endSec;

        // Ensure timestamps strictly maintain global timeline progression
        if (meSec !== undefined && meSec < lastGlobalSec) meSec = lastGlobalSec;
        if (enimSec !== undefined && enimSec < lastGlobalSec) enimSec = lastGlobalSec;

        if (meSec !== undefined && enimSec !== undefined) {
          if (orderOfActors[0] === "me") {
            if (enimSec <= meSec) enimSec = Number((meSec + 0.1).toFixed(1));
            if (totalSec <= enimSec) totalSec = Number((enimSec + 0.1).toFixed(1));
          } else {
            if (meSec <= enimSec) meSec = Number((enimSec + 0.1).toFixed(1));
            if (totalSec <= meSec) totalSec = Number((meSec + 0.1).toFixed(1));
          }
        } else if (meSec !== undefined) {
          if (totalSec <= meSec) totalSec = Number((meSec + 0.1).toFixed(1));
        } else if (enimSec !== undefined) {
          if (totalSec <= enimSec) totalSec = Number((enimSec + 0.1).toFixed(1));
        }
        if (totalSec <= lastGlobalSec) totalSec = Number((lastGlobalSec + 0.1).toFixed(1));
        lastGlobalSec = totalSec;

        const moveNum = moveOpt.moveNum ?? (mIdx + 1);
        const parts: string[] = [`No${moveNum}`];
        for (const actor of orderOfActors) {
          if (actor === "me" && meSec !== undefined) {
            parts.push("me", `${meSec.toFixed(1)}s`);
          } else if (actor === "enim" && enimSec !== undefined) {
            parts.push("enim", `${enimSec.toFixed(1)}s`);
          }
        }
        parts.push("total", `${totalSec.toFixed(1)}s`);
        const formattedSegment = parts.join("_");

        timings.push({
          moveKey: moveOpt.moveKey || `move-${mIdx + 1}`,
          moveNum,
          startSec,
          endSec: totalSec,
          durationSec: Number(((moveEndFrame - moveStartFrame) / fps).toFixed(1)),
          startFrame: moveStartFrame,
          endFrame: moveEndFrame,
          meStartFrame: moveMeStartFrame,
          enimStartFrame: moveEnimStartFrame,
          meStartSec: meSec,
          enimStartSec: enimSec,
          totalSec,
          formattedSegment,
        });
      }

      // Finish piping into ffmpeg
      ffmpeg.stdin.end();

      ffmpeg.on("close", async (code: number) => {
        if (code !== 0) {
          await fs.promises.unlink(tempOutputFile).catch(() => {});
          return reject(new Error(`FFmpeg exited with error code ${code}: ${ffmpegErr}`));
        }
        try {
          const videoBuf = await fs.promises.readFile(tempOutputFile);
          await fs.promises.unlink(tempOutputFile).catch(() => {});

          // Formatted filename: No189_me_0.0s_enim_2.1s_total_4.3s_No190_me_4.3s_enim_6.5s_total_9.2s.mp4
          const formattedFilename = timings.map(t => t.formattedSegment || `No${t.moveNum}_total_${t.endSec.toFixed(1)}s`).join("_") + ".mp4";
          const totalDurationSec = Number((currentTotalFrames / fps).toFixed(1));

          resolve({
            buffer: videoBuf,
            timings,
            totalDurationSec,
            formattedFilename,
          });
        } catch (readErr) {
          reject(readErr);
        }
      });
    } catch (renderErr) {
      try { ffmpeg.stdin.destroy(); } catch {}
      try { ffmpeg.kill(); } catch {}
      await fs.promises.unlink(tempOutputFile).catch(() => {});
      reject(renderErr);
    }
  });
}

/**
 * Renders the complete 1080x1920 @ 60fps vertical Shorts MP4 video for an 8-move pack
 * (identical to the Premiere Pro 4-track sequence: Background + 972x660 Gameplay with 18px
 * rounded corners + No.XXX header + Top Intro Subtitles + 920x180 Skill Box + Dual-Layer
 * Decaying Gauge Bar + 8-Dot Indicator).
 */
export async function renderBattleShortsVideo(options: ShortsVideoOptions): Promise<SequenceVideoOutput> {
  const fps = options.fps || 30;
  const ffmpegCmd = options.ffmpegPath || getFfmpegExecutable();

  // 1. Render the 560x380 gameplay sequence video first
  const seqResult = await renderBattleMovesSequenceVideo({
    ...options,
    fps,
    width: options.width || 560,
    height: options.height || 380,
    renderScale: options.renderScale ?? 1.0,
    ffmpegPath: ffmpegCmd,
  });

  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const tempGameplayFile = path.join(os.tmpdir(), `roguepot_shorts_raw_${stamp}.mp4`);
  const tempConfigFile = path.join(os.tmpdir(), `roguepot_shorts_cfg_${stamp}.json`);
  const tempShortsOutFile = path.join(os.tmpdir(), `roguepot_shorts_out_${stamp}.mp4`);

  try {
    await fs.promises.writeFile(tempGameplayFile, seqResult.buffer);

    const cuts: any[] = [];
    for (let i = 0; i < seqResult.timings.length; i++) {
      const t = seqResult.timings[i];
      const start = i === 0 ? 0.0 : cuts[i - 1].end;
      const end = Number((t.endFrame / fps).toFixed(4));
      const hasEnim = t.meStartFrame !== undefined && t.enimStartFrame !== undefined;
      let meEnd = end;
      if (hasEnim) {
        const secondActorFrame = Math.max(t.meStartFrame!, t.enimStartFrame!);
        meEnd = Number((secondActorFrame / fps).toFixed(4));
        if (meEnd <= start) meEnd = Number((start + 0.1).toFixed(4));
        if (meEnd >= end) meEnd = Number((end - 0.1).toFixed(4));
      }
      cuts.push({
        num: t.moveNum,
        dot: i + 1,
        start,
        me_end: meEnd,
        end: Math.max(Number((start + 0.2).toFixed(4)), end),
        has_enim: hasEnim,
      });
    }

    const { startNum, endNum } = options;
    const isPastMoveSet = startNum <= 105;
    const introColor = isPastMoveSet ? [0, 191, 255] : [255, 215, 0];
    const introFirstWord = isPastMoveSet ? "전에" : "오늘";

    const topSubtitles = [
      { text: introFirstWord, start: 0.0, end: 0.6, color: introColor },
      { text: "구현한", start: 0.6, end: 1.2, color: introColor },
      { text: "기술", start: 1.2, end: 1.8, color: introColor },
      { text: `${startNum} ~ ${endNum}`, start: 1.8, end: 4.2, color: [255, 255, 255] },
    ];

    const configData = {
      project_name: `Rogue${startNum}_${endNum}`,
      total_duration: cuts.length > 0 ? cuts[cuts.length - 1].end : seqResult.totalDurationSec,
      fps: 60,
      canvas: { width: 1080, height: 1920 },
      top_subtitles: topSubtitles,
      moves: options.movesInfo,
      cuts,
    };

    await fs.promises.writeFile(tempConfigFile, JSON.stringify(configData, null, 2), "utf-8");

    const scriptPath = path.resolve(process.cwd(), "scripts", "render_shorts_video.py");
    await new Promise<void>((resolve, reject) => {
      let pyStderr = "";
      const pyProc = spawn("python", [
        scriptPath,
        "--config", tempConfigFile,
        "--video", tempGameplayFile,
        "--output", tempShortsOutFile,
        "--ffmpeg", ffmpegCmd,
      ]);

      pyProc.stderr.on("data", (chunk: Buffer) => {
        pyStderr += chunk.toString();
      });
      pyProc.on("error", (err) => {
        reject(new Error(`Failed to run Python Shorts compositor: ${err.message}`));
      });
      pyProc.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Shorts compositor exited with code ${code}: ${pyStderr}`));
        } else {
          resolve();
        }
      });
    });

    const shortsBuf = await fs.promises.readFile(tempShortsOutFile);
    const formattedFilename = `Rogue${startNum}_${endNum}.mp4`;

    // Also save a copy to D:\VideoProject if that directory exists
    const videoProjDir = "D:\\VideoProject";
    if (fs.existsSync(videoProjDir)) {
      const destFile = path.join(videoProjDir, formattedFilename);
      await fs.promises.writeFile(destFile, shortsBuf).catch(() => {});
    }

    return {
      buffer: shortsBuf,
      timings: seqResult.timings,
      totalDurationSec: seqResult.totalDurationSec,
      formattedFilename,
    };
  } finally {
    await fs.promises.unlink(tempGameplayFile).catch(() => {});
    await fs.promises.unlink(tempConfigFile).catch(() => {});
    await fs.promises.unlink(tempShortsOutFile).catch(() => {});
  }
}
