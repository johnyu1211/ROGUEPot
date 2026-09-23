import { command as battleactCommand } from "../src/commands/battleact.js";
import { MOVE_REGISTRY } from "../src/battle/moves/moveRegistry.js";

async function testBattleAct() {
  console.log("==========================================");
  console.log("🧪 Testing /battleact command execution");
  console.log("==========================================");

  let repliedEmbed: any = null;
  let repliedFiles: any[] = [];

  const mockInteraction: any = {
    user: { id: "test_user_discord" },
    options: {
      getString: (name: string, required?: boolean) => {
        if (name === "move") return "smog";
        if (name === "attacker") return "weezing";
        if (name === "defender") return "cloyster";
        if (name === "hit") return "normal";
        if (name === "side") return "player";
        return null;
      },
      getFocused: (full?: boolean) => ({ name: "move", value: "스모그" }),
    },
    deferReply: async () => {
      console.log("✅ deferReply() called");
    },
    editReply: async (data: any) => {
      repliedEmbed = data.embeds?.[0];
      repliedFiles = data.files || [];
      console.log("✅ editReply() received!");
    },
    respond: async (choices: any[]) => {
      console.log(`✅ Autocomplete responded with ${choices.length} choices`);
    },
  };

  // 1. Test Autocomplete
  console.log("\n--- Testing Autocomplete ---");
  await (battleactCommand as any).autocomplete(mockInteraction);

  // 2. Test Execution
  console.log("\n--- Testing Command Execute ---");
  const t0 = Date.now();
  await battleactCommand.execute(mockInteraction);
  const t1 = Date.now();

  console.log(`⏱️ Execution finished in ${t1 - t0}ms`);
  console.log(`Embed Title: ${repliedEmbed?.data?.title}`);
  console.log(`Files count: ${repliedFiles.length}`);
  if (repliedFiles.length > 0) {
    const file = repliedFiles[0];
    console.log(`Attached file name: ${file.name}, buffer size: ${(file.attachment.length / 1024).toFixed(1)} KB`);
  }

  console.log("==========================================");
  console.log("🎉 /battleact test completed successfully!");
  console.log("==========================================");
}

testBattleAct().catch(console.error);
