import { Events, Interaction } from "discord.js";
import { BotEvent, ExtendedClient } from "../types/index.js";

export const interactionCreateEvent: BotEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

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
  },
};
