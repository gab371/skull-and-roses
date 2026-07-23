import { test, expect } from "@playwright/test";
import { createEngine, act, forceHands, forceScore, getState } from "./helpers/engine";
import { allRosesHand, skullFirstHand } from "./fixtures/scenarios";

/**
 * Skull & Roses — per-rule E2E specs. The engine is driven directly via
 * window.__testHooks__ (no PeerJS, no 2nd browser context) for fast,
 * deterministic coverage. Skull has no deal randomness (fixed 3 ROSE + 1
 * SKULL); edge cases are set up by forcing hands/score. Card uids after
 * forceHands follow `${playerId}_test_${i}` in the order given.
 */

type Page = import("@playwright/test").Page;

async function lobbyVisible(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Créer une Table/i })).toBeVisible({ timeout: 30_000 });
}

/** Create a 2-player game and start it. Returns the post-startGame state. */
async function setupTwoPlayers(page: Page) {
  await createEngine(page);
  await act(page, "addPlayer", "p1", "Host", "💀", true);
  await act(page, "addPlayer", "p2", "Guest", "💀", false);
  expect(await act(page, "startGame")).toBe(true);
  return getState(page);
}

/** Both players place their first card (p1 then p2). Hands are forced first. */
async function placeOneEach(page: Page, p1Hand: string[], p2Hand: string[]) {
  await forceHands(page, { p1: p1Hand, p2: p2Hand });
  expect(await act(page, "placeCard", "p1", "p1_test_0")).toBe(true);
  expect(await act(page, "placeCard", "p2", "p2_test_0")).toBe(true);
}

test("startGame: 2 players → PLACING, 3 ROSE + 1 SKULL, score 0, p1 to act", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  const state = await getState(page);
  expect(state.phase).toBe("PLACING");
  expect(state.activePlayerIndex).toBe(0);
  const p1 = state.players[0];
  expect(p1.hand.length).toBe(4);
  expect(p1.hand.filter((c: any) => c.type === "ROSE").length).toBe(3);
  expect(p1.hand.filter((c: any) => c.type === "SKULL").length).toBe(1);
  expect(p1.score).toBe(0);
});

test("placeCard: active player places → pile grows, hand shrinks, turn passes", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await forceHands(page, { p1: allRosesHand, p2: allRosesHand });
  expect(await act(page, "placeCard", "p1", "p1_test_0")).toBe(true);
  const state = await getState(page);
  expect(state.players[0].pile.length).toBe(1);
  expect(state.players[0].hand.length).toBe(3);
  expect(state.activePlayerIndex).toBe(1);
});

test("placeCard out of turn → false", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  expect(await act(page, "placeCard", "p2", "p2_test_0")).toBe(false);
  const state = await getState(page);
  expect(state.phase).toBe("PLACING");
  expect(state.players[1].pile.length).toBe(0);
});

test("startBid too early (someone has 0 placed) → false", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  expect(await act(page, "startBid", "p1", 1)).toBe(false);
  expect((await getState(page)).phase).toBe("PLACING");
});

test("startBid valid → BIDDING, highestBid + bidWinner set", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await placeOneEach(page, allRosesHand, allRosesHand);
  expect(await act(page, "startBid", "p1", 2)).toBe(true);
  const state = await getState(page);
  expect(state.phase).toBe("BIDDING");
  expect(state.highestBid).toBe(2);
  expect(state.bidWinnerId).toBe("p1");
  expect(state.activePlayerIndex).toBe(1);
});

test("raiseBid must be > highestBid and ≤ total placed", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await forceHands(page, { p1: allRosesHand, p2: allRosesHand });
  await act(page, "placeCard", "p1", "p1_test_0");
  await act(page, "placeCard", "p2", "p2_test_0");
  await act(page, "placeCard", "p1", "p1_test_1");
  await act(page, "placeCard", "p2", "p2_test_1");
  await act(page, "startBid", "p1", 2);
  expect(await act(page, "raiseBid", "p2", 3)).toBe(true);
  let state = await getState(page);
  expect(state.highestBid).toBe(3);
  expect(state.bidWinnerId).toBe("p2");
  expect(await act(page, "raiseBid", "p1", 3)).toBe(false);
  expect(await act(page, "raiseBid", "p1", 5)).toBe(false);
  state = await getState(page);
  expect(state.highestBid).toBe(3);
});

test("passBid last bidder → REVEALING, cardsToReveal = highestBid", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await placeOneEach(page, allRosesHand, allRosesHand);
  await act(page, "startBid", "p1", 2);
  expect(await act(page, "passBid", "p2")).toBe(true);
  const state = await getState(page);
  expect(state.phase).toBe("REVEALING");
  expect(state.cardsToReveal).toBe(2);
  expect(state.bidWinnerId).toBe("p1");
  expect(state.activePlayerIndex).toBe(0);
});

test("revealCard: must reveal own cards first", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await placeOneEach(page, allRosesHand, allRosesHand);
  await act(page, "startBid", "p1", 2);
  await act(page, "passBid", "p2");
  expect(await act(page, "revealCard", "p1", "p2")).toBe(false);
  expect((await getState(page)).phase).toBe("REVEALING");
});

test("revealCard roses success → +1 score, ROUND_END", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await placeOneEach(page, allRosesHand, allRosesHand);
  await act(page, "startBid", "p1", 2);
  await act(page, "passBid", "p2");
  expect(await act(page, "revealCard", "p1", "p1")).toBe(true);
  expect(await act(page, "revealCard", "p1", "p2")).toBe(true);
  const state = await getState(page);
  expect(state.players[0].score).toBe(1);
  expect(state.phase).toBe("ROUND_END");
});

test("revealCard SKULL → failure, challenger loses 1 card, ROUND_END", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await placeOneEach(page, skullFirstHand, allRosesHand);
  await act(page, "startBid", "p1", 2);
  await act(page, "passBid", "p2");
  expect(await act(page, "revealCard", "p1", "p1")).toBe(true);
  const state = await getState(page);
  expect(state.phase).toBe("ROUND_END");
  // p1: 4 cards - 1 placed SKULL (revealed, not returned) - 1 random penalty = 2
  expect(state.players[0].hand.length).toBe(2);
  // p2: 4 cards - 1 placed ROSE (returned on failure) = 4
  expect(state.players[1].hand.length).toBe(4);
});

test("victory: score reaches 2 → GAME_OVER with winner", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await forceScore(page, "p1", 1);
  await placeOneEach(page, allRosesHand, allRosesHand);
  await act(page, "startBid", "p1", 2);
  await act(page, "passBid", "p2");
  await act(page, "revealCard", "p1", "p1");
  await act(page, "revealCard", "p1", "p2");
  const state = await getState(page);
  expect(state.players[0].score).toBe(2);
  expect(state.phase).toBe("GAME_OVER");
  expect(state.winnerId).toBe("p1");
});

test("startNextRound → PLACING, bid reset", async ({ page }) => {
  await lobbyVisible(page);
  await setupTwoPlayers(page);
  await placeOneEach(page, allRosesHand, allRosesHand);
  await act(page, "startBid", "p1", 2);
  await act(page, "passBid", "p2");
  await act(page, "revealCard", "p1", "p1");
  await act(page, "revealCard", "p1", "p2");
  expect((await getState(page)).phase).toBe("ROUND_END");
  expect(await act(page, "startNextRound")).toBe(true);
  const state = await getState(page);
  expect(state.phase).toBe("PLACING");
  expect(state.highestBid).toBe(0);
  expect(state.bidWinnerId).toBe(null);
});


