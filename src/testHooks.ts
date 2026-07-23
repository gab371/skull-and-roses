import { SkullGameEngine } from "./core/gameEngine";
import type { Card, CardType, GamePhase } from "./core/types";

/**
 * Test hooks for Skull & Roses E2E tests.
 *
 * Exposed on `window.__testHooks__` ONLY in non-production builds (Playwright
 * runs `vite` in dev mode, so the hooks are present during tests; the prod
 * build strips them). Skull has no deal randomness (fixed 3 ROSE + 1 SKULL);
 * the main hooks are `forceScore` / `setPhase` and driving the live engine via
 * `act`. No PeerJS, no 2nd browser context. See
 * docs/plans/06_tests_e2e_par_jeu/plan.md (Idea 6, Step 2).
 */
declare global {
  interface Window {
    __testHooks__?: SkullTestHooks;
  }
}

export interface SkullTestHooks {
  /** Create a fresh standalone engine (no PeerJS) and register it for the other hooks. */
  createEngine(): unknown;
  /** Replace a player's hand by card-type list (fresh Card objects are built). */
  forceHands(hands: Record<string, CardType[]>): void;
  /** Force a player's score (wins). */
  forceScore(playerId: string, score: number): void;
  /** Force the engine phase. */
  setPhase(phase: GamePhase): void;
  /** Call an engine method by name with args (returns its result, serialized). */
  act(method: string, args: unknown[]): unknown;
  /** Read the live engine state. */
  getState(): unknown;
  /** Get the live engine instance (or null if not yet created). */
  getEngine(): SkullGameEngine | null;
}

let engineGetter: (() => SkullGameEngine | null) | null = null;
let testEngine: SkullGameEngine | null = null;

/** Called from useGame to expose the live engine ref to the test hooks. */
export function registerEngineGetter(getter: () => SkullGameEngine | null): void {
  engineGetter = getter;
}

function liveEngine(): SkullGameEngine | null {
  return testEngine ?? engineGetter?.() ?? null;
}

export function installTestHooks(): void {
  if (typeof window === "undefined") return;
  if (import.meta.env.PROD) return; // never expose in production builds
  if (window.__testHooks__) return; // idempotent

  window.__testHooks__ = {
    createEngine: () => {
      testEngine = new SkullGameEngine();
      return testEngine.state;
    },
    forceHands: (hands) => {
      const engine = liveEngine();
      if (!engine) return;
      for (const [playerId, types] of Object.entries(hands)) {
        const p = engine.state.players.find((pl) => pl.id === playerId);
        if (!p) continue;
        const hand: Card[] = types.map((type, i) => ({ uid: `${playerId}_test_${i}`, type }));
        (p as unknown as { hand: Card[] }).hand = hand;
      }
    },
    forceScore: (playerId, score) => {
      const engine = liveEngine();
      const p = engine?.state.players.find((pl) => pl.id === playerId);
      if (p) (p as unknown as { score: number }).score = score;
    },
    setPhase: (phase) => {
      const engine = liveEngine();
      if (engine) (engine.state as unknown as { phase: GamePhase }).phase = phase;
    },
    act: (method, args) => {
      const engine = liveEngine();
      if (!engine) return undefined;
      const fn = (engine as unknown as Record<string, (...a: unknown[]) => unknown>)[method];
      if (typeof fn !== "function") return undefined;
      return fn.apply(engine, args);
    },
    getState: () => liveEngine()?.state ?? null,
    getEngine: () => liveEngine(),
  };
}
