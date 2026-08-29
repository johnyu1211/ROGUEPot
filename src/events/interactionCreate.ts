import { Events, Interaction } from "discord.js";
import { BotEvent, ExtendedClient } from "../types/index.js";
import { createBaseEmbed, COLORS } from "../utils/embed.js";

export const interactionCreateEvent: BotEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    // 1. Slash Commands
    if (interaction.isChatInputCommand()) {
      const client = interaction.client as ExtendedClient;
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`[ERROR] Error executing command ${interaction.commandName}:`, error);
        const errorMessage = {
          content: "명령어를 실행하는 동안 오류가 발생했습니다.",
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
      return;
    }

    // 2. Button Interactions
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // Check if button belongs to this user
      const parts = customId.split("_");
      const ownerId = parts[parts.length - 1];

      if (ownerId && ownerId !== interaction.user.id && ownerId.length > 15) {
        await interaction.reply({
          content: "❌ 이 게임 세션의 주인이 아닙니다! 본인의 스레드에서 `/open` 명령어를 사용해주세요.",
          ephemeral: true,
        });
        return;
      }

      if (customId.startsWith("game_start_")) {
        // Prototype: Starter selection intro
        const starterEmbed = createBaseEmbed(
          "🌟 스타팅 포켓몬을 선택하세요!",
          "모험을 함께할 1세대 대표 스타팅 포켓몬 중 하나를 선택하세요!\n\n" +
          "🌱 **이상해씨 (Bulbasaur)** - 풀/독 | 씨뿌리기와 수면가루를 활용한 안정적인 밸런스형\n" +
          "🔥 **파이리 (Charmander)** - 불꽃 | 강력한 화력과 높은 성장 잠재력의 공격형\n" +
          "💧 **꼬부기 (Squirtle)** - 물 | 단단한 방어력과 지속력을 갖춘 탱커형"
        )
          .setColor(COLORS.POKEROGUE_GOLD)
          .setImage("https://play.pokemonshowdown.com/sprites/gen5/charmander.png");

        await interaction.reply({
          embeds: [starterEmbed],
          content: `🎮 ${interaction.user} 님, 준비되셨나요? 곧 스타팅 선택 및 1웨이브 배틀 시스템이 연결됩니다!`,
        });
        return;
      }

      if (customId.startsWith("game_help_")) {
        const helpEmbed = createBaseEmbed(
          "📖 PokéRogue 게임 룰 가이드",
          "• **1. 런(Run) 시작**: 스타팅 포켓몬을 선택하여 1웨이브(타운/숲)부터 출발합니다.\n" +
          "• **2. 턴제 배틀**: 기술을 골라 야생 포켓몬의 체력을 깎고 쓰러뜨리거나 몬스터볼을 던져 잡으세요.\n" +
          "• **3. 상점 보상**: 웨이브를 깰 때마다 상점에서 무작위 3개의 아이템 중 1개를 획득합니다.\n" +
          "• **4. 바이옴 이동**: 10웨이브마다 보스전이 펼쳐지며 다음 바이옴으로 이동합니다."
        ).setColor(COLORS.PRIMARY);

        await interaction.reply({
          embeds: [helpEmbed],
          ephemeral: true,
        });
        return;
      }
    }
  },
};
