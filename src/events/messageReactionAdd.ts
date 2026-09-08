import { MessageReaction, User, Events } from "discord.js";
import { battleService } from "../services/battleService.js";
import { saveService } from "../services/saveService.js";
import { findPerkByEmoji } from "../utils/perkSvgIcons.js";

// ClickIt (pokeball_1): The permanent reaction maintained on battle messages
export const ACTIVE_BALL_ID = "1545110604912529498";
export const ACTIVE_BALL_NAME = "pokeball_1";

// Legacy NoActive ball (will be cleaned up if detected)
export const INACTIVE_BALL_ID = "1545124207040532501";
export const INACTIVE_BALL_NAME = "NoActive";

export const activePerkBannerMessages = new Map<string, any>();

export async function deleteActivePerkBannerMessage(key: string) {
  const msg = activePerkBannerMessages.get(key);
  if (msg) {
    activePerkBannerMessages.delete(key);
    if (typeof msg.delete === "function") {
      await msg.delete().catch(() => null);
    }
  }
}

/**
 * Ensures ClickIt (pokeball_1: 1545110604912529498) is ALWAYS maintained on the battle message.
 * Cleans up any leftover NoActive reactions so NoActive is never shown.
 */
export async function ensureClickItReaction(message: any, clientUser?: any): Promise<void> {
  try {
    if (!message || typeof message.react !== "function") return;

    // 1. Add ClickIt (pokeball_1) if not already present
    await message
      .react(`pokeball_1:${ACTIVE_BALL_ID}`)
      .catch(() => message.react(ACTIVE_BALL_ID))
      .catch(() => null);

    // 2. Remove NoActive reaction if lingering
    const reactions =
      message.reactions?.cache?.size > 0
        ? message.reactions.cache
        : await message.reactions?.fetch?.().catch(() => null);

    if (reactions) {
      const inact = reactions.find(
        (r: any) =>
          r.emoji.id === INACTIVE_BALL_ID ||
          r.emoji.name === INACTIVE_BALL_NAME
      );
      if (inact) {
        await inact.remove().catch(async () => {
          if (clientUser?.id) await inact.users.remove(clientUser.id).catch(() => null);
        });
      }
    }
  } catch {
    // Ignore reaction errors
  }
}

// Alias for backward compatibility
export const setBallReactionState = ensureClickItReaction;

/**
 * Clears old perk reactions from previous turns after they have been used 1 time
 */
export async function clearAllPerkReactions(message: any, clientUser?: any) {
  try {
    if (!message || !message.reactions) return;
    const reactions =
      message.reactions.cache?.size > 0
        ? message.reactions.cache
        : await message.reactions.fetch().catch(() => null);
    if (!reactions) return;

    for (const r of reactions.values()) {
      const isClickIt =
        r.emoji.id === ACTIVE_BALL_ID ||
        r.emoji.name === ACTIVE_BALL_NAME ||
        r.emoji.name?.toLowerCase() === "clickit";

      if (!isClickIt) {
        await r.remove().catch(async () => {
          if (clientUser?.id) {
            await r.users.remove(clientUser.id).catch(() => null);
          }
        });
      }
    }
  } catch {
    // Ignore
  }
}

export const messageReactionAddEvent = {
  name: Events.MessageReactionAdd,
  once: false,
  async execute(reaction: MessageReaction, user: User) {
    // 1. Strictly ignore bot's own reactions
    if (user.bot || user.id === reaction.client.user?.id) return;

    try {
      // 2. Resolve partials if necessary
      if (user.partial) {
        await user.fetch().catch(() => null);
      }
      if (user.bot || user.id === reaction.client.user?.id) return;
      if (reaction.partial) {
        await reaction.fetch().catch(() => null);
      }
      if (reaction.message.partial) {
        await reaction.message.fetch().catch(() => null);
      }

      const message = reaction.message;

      // 3. User clicked a perk emoji that the bot reacted with
      const perkDef = findPerkByEmoji(reaction.emoji.name);
      if (perkDef) {
        // Clean user's reaction so bot's reaction remains intact
        await reaction.users.remove(user.id).catch(() => null);
        return;
      }

      // 4. If NoActive is clicked, remove it permanently
      const isInactiveBall =
        reaction.emoji.id === INACTIVE_BALL_ID ||
        reaction.emoji.name === INACTIVE_BALL_NAME;

      if (isInactiveBall) {
        await reaction.remove().catch(() => null);
        await ensureClickItReaction(message, reaction.client.user);
        return;
      }

      // 5. User clicked ClickIt (pokeball_1 / ClickiT: 1545110604912529498)
      const isActiveBall =
        reaction.emoji.id === ACTIVE_BALL_ID ||
        reaction.emoji.name === ACTIVE_BALL_NAME ||
        reaction.emoji.name?.toLowerCase() === "clickit";

      if (!isActiveBall) return;

      // Clean the user's reaction immediately so they can click repeatedly
      await reaction.users.remove(user.id).catch(() => null);

      // 6. Check if in '기술시전 대기상태 (모든 버튼 비활성화 상태)'
      const rows = (message.components || []) as any[];
      if (rows.length === 0) return;

      const hasComponents = rows.some((r: any) => (r.components || []).length > 0);
      if (!hasComponents) return;

      const allDisabled = rows.every((row: any) => {
        const comps = row.components || [];
        return comps.length > 0 && comps.every((c: any) => Boolean(c.disabled));
      });

      // [핵심 요구사항] 기술대기상태(모든 버튼 비활성화)가 아닐 때는 클릭해도 효과 발동 안 함!
      if (!allDisabled) {
        return;
      }

      // 7. Extract battle userId and slotId from button customId
      let battleUserId = user.id;
      let battleSlotId = 1;
      let foundBattle = false;

      for (const row of rows) {
        for (const comp of (row.components || [])) {
          const cId = comp.customId || comp.data?.custom_id || "";
          if (cId.startsWith("battle_")) {
            const parts = cId.split("_");
            if (parts.length >= 3) {
              battleUserId = parts[parts.length - 1] || user.id;
              battleSlotId = parseInt(parts[parts.length - 2], 10) || 1;
              foundBattle = true;
              break;
            }
          }
        }
        if (foundBattle) break;
      }

      if (!foundBattle) return;

      // Only battle owner can activate perks
      if (user.id !== battleUserId) return;

      const battle = battleService.getOrCreateBattle(battleUserId, battleSlotId);
      // 1) If the battle session is already finished (VICTORY, DEFEAT, or enemy fainted), do NOT trigger or react!
      if (battle.phase === "VICTORY" || battle.phase === "DEFEAT" || battle.enemy.hp <= 0) {
        return;
      }
      // 2) If this message is an old finished session message and not the active message, do NOT trigger!
      if (battle.messageId && message.id !== battle.messageId) {
        return;
      }

      // 8. Trigger 5% Probability Perk
      const result = battleService.triggerBallPerk(battleUserId, battleSlotId);
      if (result.success && result.perk) {
        const perk = result.perk;
        console.log(`[BALL PERK SUCCESS!] ${perk.nameKo} (${perk.emoji}) triggered for user ${battleUserId}!`);

        // Clean any existing perk reaction on this message first so only 1 perk emoji exists at a time
        await clearAllPerkReactions(message, reaction.client.user);

        // 1. Send dedicated notification message to Discord chat channel!
        const profile = saveService.getProfile(user.id);
        const isKo = profile.language !== "en";
        const title = isKo ? perk.nameKo : perk.nameEn;
        const desc = isKo ? perk.descKo : perk.descEn;

        const bannerKey = `${battleUserId}_${battleSlotId}`;
        await deleteActivePerkBannerMessage(bannerKey);

        const bannerMsg = await (message.channel as any).send({
          content: isKo
            ? `✨ **${perk.emoji} ${title}** 발동!\n> ${desc}`
            : `✨ **${perk.emoji} ${title}** Activated!\n> ${desc}`,
        }).catch((err: any) => {
          console.error("[PERK BANNER SEND ERROR]", err);
          return null;
        });

        if (bannerMsg) {
          activePerkBannerMessages.set(bannerKey, bannerMsg);
        }

        // 2. Also react to the message with emoji
        const candidates = [
          perk.emoji,
          perk.emoji.replace(/[\uFE0E\uFE0F]/g, ""),
        ];
        if (perk.id === "surveillance") candidates.push("👁️", "👁", "👀");
        if (perk.id === "acid_dissolve") candidates.push("🧪", "🟢");

        for (const emo of candidates) {
          try {
            await message.react(emo);
            console.log(`[BALL PERK REACT SUCCESS] Reacted with ${emo}`);
            break;
          } catch (reactErr: any) {
            console.warn(`[BALL PERK REACT RETRY] Failed with ${emo}:`, reactErr?.message || reactErr);
          }
        }
      }
    } catch (err) {
      console.error("[MESSAGE REACTION ADD ERROR]", err);
    }
  },
};
