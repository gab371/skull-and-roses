import { test, expect } from "@playwright/test";
import { createEngine, act, forceHands, getState } from "./helpers/engine";
import { allRosesHand } from "./fixtures/scenarios";

/**
 * Skull & Roses — full-game E2E spec. Plays a complete 2-player game from
 * PLACING to GAME_OVER via the engine hooks (deterministic, no PeerJS). Both
 * players hold only roses; p1 wins two consecutive rounds (each: place 1
 * rose, bid 2, p2 passes, reveal both roses) to reach score 2.
 */

type Page = import("@playwright/test").Page;

async function lobbyVisible(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Créer une Table/i })).toBeVisible({ timeout: 30_000 });
}

/** Play one round: both place a rose, p1 bids 2, p2 passes, p1 reveals both roses. */
async function playRound(page: Page) {
  await forceHands(page, { p1: allRosesHand, p2: allRosesHand });
  await act(page, "placeCard", "p1", "p1_test_0");
  await act(page, "placeCard", "p2", "p2_test_0");
  await act(page, "startBid", "p1", 2);
  await act(page, "passBid", "p2");
  await act(page, "revealCard", "p1", "p1");
  await act(page, "revealCard", "p1", "p2");
}

test("full game: 2 rounds won by p1 → GAME_OVER", async ({ page }) => {
  await lobbyVisible(page);
  await createEngine(page);
  await act(page, "addPlayer", "p1", "Host", "💀", true);
  await act(page, "addPlayer", "p2", "Guest", "💀", false);
  await act(page, "startGame");

  await playRound(page);
  let state = await getState(page);
  expect(state.players[0].score).toBe(1);
  expect(state.phase).toBe("ROUND_END");
  await act(page, "startNextRound");

  await playRound(page);
  state = await getState(page);
  expect(state.players[0].score).toBe(2);
  expect(state.phase).toBe("GAME_OVER");
  expect(state.winnerId).toBe("p1");
});
