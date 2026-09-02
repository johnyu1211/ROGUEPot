import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../types/index.js";
import { saveService } from "../services/saveService.js";
import { db } from "../services/db.js";
import { MOVES_DATA } from "../data/movesKo.js";
import { createBaseEmbed, COLORS } from "../utils/embed.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("setmoves")
    .setDescription("포켓몬의 기술을 번호 범위 또는 이름으로 즉시 변경합니다.")
    .addIntegerOption((opt) =>
      opt
        .setName("start_id")
        .setDescription("시작 기술 번호 (예: 5를 입력하면 005~008번 기술 4개로 자동 설정)")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("move1").setDescription("1번 기술 이름 (한글 또는 영문)").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("move2").setDescription("2번 기술 이름 (한글 또는 영문)").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("move3").setDescription("3번 기술 이름 (한글 또는 영문)").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("move4").setDescription("4번 기술 이름 (한글 또는 영문)").setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const userId = interaction.user.id;
      const profile = saveService.getProfile(userId);
      const activeSlotId = profile.activeSlotId || 1;
      const slot = profile.slots[activeSlotId];

      if (!slot || !slot.party || slot.party.length === 0) {
        await interaction.editReply({
          content: "❌ 활성화된 게임 슬롯이나 파티 포켓몬이 없습니다. 먼저 `/open`으로 게임을 시작해주세요.",
        });
        return;
      }

      const startId = interaction.options.getInteger("start_id");
      const m1 = interaction.options.getString("move1");
      const m2 = interaction.options.getString("move2");
      const m3 = interaction.options.getString("move3");
      const m4 = interaction.options.getString("move4");

      let selectedMoves: string[] = [];

      if (startId !== null && startId !== undefined) {
        // Find 4 moves by ID range [startId, startId + 3]
        const allMoves = Object.values(MOVES_DATA);
        for (let id = startId; id < startId + 4; id++) {
          const found = allMoves.find((m) => m.id === id);
          if (found) {
            selectedMoves.push(found.nameKo);
          }
        }
      } else if (m1 || m2 || m3 || m4) {
        if (m1) selectedMoves.push(m1);
        if (m2) selectedMoves.push(m2);
        if (m3) selectedMoves.push(m3);
        if (m4) selectedMoves.push(m4);
      } else {
        selectedMoves = ["메가톤펀치", "고양이돈받기", "불꽃펀치", "냉동펀치"];
      }

      if (selectedMoves.length === 0) {
        selectedMoves = ["메가톤펀치", "고양이돈받기", "불꽃펀치", "냉동펀치"];
      }

      // Update slot party in DB
      const party = slot.party;
      party[0].moves = selectedMoves;
      party[0].movePps = selectedMoves.map(() => 20);
      party[0].maxMovePps = selectedMoves.map(() => 20);

      db.prepare("UPDATE game_slots SET party = ? WHERE user_id = ? AND slot_id = ?").run(
        JSON.stringify(party),
        userId,
        activeSlotId
      );

      const embed = createBaseEmbed(
        "⚡ 기술 변경 완료!",
        `**${party[0].nameKo || party[0].name}**의 기술이 다음으로 즉시 변경되었습니다:\n\n` +
          selectedMoves.map((m, i) => `**${i + 1}.** ${m}`).join("\n")
      ).setColor(COLORS.SUCCESS);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[ERROR] Failed to run /setmoves command:", error);
      await interaction.editReply({
        content: "기술 변경 중 오류가 발생했습니다.",
      });
    }
  },
};
