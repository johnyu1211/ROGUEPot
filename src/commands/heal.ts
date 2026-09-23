import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types/index.js";
import { saveService } from "../services/saveService.js";
import { db } from "../services/db.js";
import { getMoveData } from "../data/movesKo.js";
import { battleService } from "../services/battleService.js";
import { createBaseEmbed, COLORS } from "../utils/embed.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("heal")
    .setDescription("현재 파티의 모든 포켓몬 체력(HP), 상태이상, 기술 PP를 100% 완전 회복합니다."),
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

      const party = slot.party;
      const restoreLogs: string[] = [];

      for (const mon of party) {
        mon.hp = mon.maxHp || mon.hp;
        if (mon.moves && Array.isArray(mon.moves)) {
          mon.movePps = mon.moves.map((m: string) => getMoveData(m)?.pp || 20);
          mon.maxMovePps = [...mon.movePps];
        }
        const monName = mon.nameKo || mon.name;
        const ppSummary = mon.moves?.map((m: string, i: number) => `${m} (${mon.movePps?.[i]}/${mon.movePps?.[i]})`).join(", ");
        restoreLogs.push(`✨ **${monName}**: HP ${mon.hp}/${mon.maxHp} | PP: ${ppSummary || "N/A"}`);
      }

      // 1. Update SQLite DB
      db.prepare("UPDATE game_slots SET party = ? WHERE user_id = ? AND slot_id = ?").run(
        JSON.stringify(party),
        userId,
        activeSlotId
      );

      // 2. Immediately update in-memory active battle
      battleService.healActiveBattle(userId, activeSlotId);

      const embed = createBaseEmbed(
        "💖 포켓몬 센터 회복 완료!",
        `슬롯 **#${activeSlotId}**의 모든 파티 포켓몬 체력과 기술 PP가 완전 회복되었습니다!\n\n` +
          restoreLogs.join("\n")
      ).setColor(COLORS.SUCCESS);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[ERROR] Failed to run /heal command:", error);
      await interaction.editReply({
        content: "파티 회복 처리 중 오류가 발생했습니다.",
      });
    }
  },
};
