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
 * 5. Dynamic timestamp generation for each move (e.g. No189_0s_5s_No190_5s_10s_No191_10s_15s_No192_15s_20s.mp4)
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

    try {
      for (let mIdx = 0; mIdx < movesCount; mIdx++) {
        const isLastMove = (mIdx === movesCount - 1);
        const moveOpt = options.moves[mIdx];
        const moveStartFrame = currentTotalFrames;

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
        const startSec = Math.round(moveStartFrame / fps);
        let endSec = Math.round(moveEndFrame / fps);
        if (endSec <= startSec) endSec = startSec + 1;

        timings.push({
          moveKey: moveOpt.moveKey || `move-${mIdx + 1}`,
          moveNum: moveOpt.moveNum ?? (mIdx + 1),
          startSec,
          endSec,
          durationSec: Number(((moveEndFrame - moveStartFrame) / fps).toFixed(1)),
          startFrame: moveStartFrame,
          endFrame: moveEndFrame,
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

          // Formatted filename: No189_0s_5s_No190_5s_10s_No191_10s_15s_No192_15s_20s.mp4
          const formattedFilename = timings.map(t => `No${t.moveNum}_${t.startSec}s_${t.endSec}s`).join("_") + ".mp4";
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
