import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  file: string;
  category: "engine" | "moves";
  passed: boolean;
  durationMs: number;
  errorOutput?: string;
}

const args = process.argv.slice(2);
const runEngineOnly = args.includes("--engine");
const runMovesOnly = args.includes("--moves");
const filterArg = args.find((a) => !a.startsWith("--"));

async function runTestFile(filePath: string): Promise<{ passed: boolean; durationMs: number; output: string }> {
  const start = Date.now();
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const command = isWindows ? "cmd.exe" : "npx";
    const commandArgs = isWindows ? ["/c", "npx", "tsx", filePath] : ["tsx", filePath];
    const proc = spawn(command, commandArgs, {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env },
    });

    let output = "";
    proc.stdout?.on("data", (data) => {
      output += data.toString();
    });
    proc.stderr?.on("data", (data) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        passed: code === 0,
        durationMs: Date.now() - start,
        output,
      });
    });
  });
}

async function main() {
  console.log("==================================================");
  console.log("🚀 ROGUEPot 배틀 엔진 & 기술 테스트 스위트 실행기");
  console.log("==================================================");

  const engineDir = path.join(__dirname, "engine");
  const movesDir = path.join(__dirname, "moves");

  const engineFiles = fs.existsSync(engineDir)
    ? fs.readdirSync(engineDir).filter((f) => f.endsWith(".test.ts")).map((f) => ({ file: f, path: path.join(engineDir, f), category: "engine" as const }))
    : [];

  const moveFiles = fs.existsSync(movesDir)
    ? fs.readdirSync(movesDir).filter((f) => f.endsWith(".test.ts")).map((f) => ({ file: f, path: path.join(movesDir, f), category: "moves" as const }))
    : [];

  let targets = [];
  if (runEngineOnly) {
    targets = engineFiles;
  } else if (runMovesOnly) {
    targets = moveFiles;
  } else {
    targets = [...engineFiles, ...moveFiles];
  }

  if (filterArg) {
    targets = targets.filter((t) => t.file.toLowerCase().includes(filterArg.toLowerCase()));
  }

  console.log(`총 ${targets.length}개의 테스트 파일을 실행합니다...\n`);

  const results: TestResult[] = [];

  for (const target of targets) {
    process.stdout.write(`⏳ [${target.category.toUpperCase()}] ${target.file} ... `);
    const res = await runTestFile(target.path);

    results.push({
      file: target.file,
      category: target.category,
      passed: res.passed,
      durationMs: res.durationMs,
      errorOutput: res.passed ? undefined : res.output,
    });

    if (res.passed) {
      console.log(`✅ PASS (${res.durationMs}ms)`);
    } else {
      console.log(`❌ FAIL (${res.durationMs}ms)`);
    }
  }

  console.log("\n==================================================");
  console.log("📊 테스트 스위트 종합 결과");
  console.log("==================================================");

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  for (const r of results) {
    const icon = r.passed ? "✅" : "❌";
    const cat = `[${r.category}]`.padEnd(9);
    console.log(`${icon} ${cat} ${r.file.padEnd(32)} ${r.durationMs}ms`);
  }

  console.log("--------------------------------------------------");
  console.log(`총계: ${results.length} 스위트 중 ${passedCount}개 통과 / ${failedCount}개 실패`);
  console.log("==================================================");

  if (failedCount > 0) {
    console.log("\n❌ [실패 상세 로그]");
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`\n--- ${r.file} 실패 출력 ---`);
      console.log(r.errorOutput);
    }
    process.exit(1);
  } else {
    console.log("\n🎉 모든 테스트 스위트가 완벽하게 통과했습니다!");
  }
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
