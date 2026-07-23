import type { CardType } from "../../src/core/types";

/**
 * Mock hand fixtures for Skull & Roses E2E tests.
 *
 * Skull has no deal randomness (startGame always deals 3 ROSE + 1 SKULL), so
 * these fixtures are only needed to set up deterministic edge cases (e.g. a
 * player holding a skull placed first, or a player holding only roses).
 *
 * Card uids are built by the test hooks as `${playerId}_test_${i}` in the
 * order given, so `hand[0]` is the first card placed by a test.
 */

/** 4 roses — a player who can never reveal a skull. Place h[0] = ROSE. */
export const allRosesHand: CardType[] = ["ROSE", "ROSE", "ROSE", "ROSE"];

/** Standard 3 roses + 1 skull (matches startGame distribution). */
export const standardHand: CardType[] = ["ROSE", "ROSE", "ROSE", "SKULL"];

/** Skull first — place h[0] = SKULL (so it is the only/top card on the pile). */
export const skullFirstHand: CardType[] = ["SKULL", "ROSE", "ROSE", "ROSE"];
