import type { GameState } from "../../core/types";
import { ExpandToggle } from "./ExpandToggle";

interface PhaseStatusBarProps {
  gameState: GameState;
  onNextRound: () => void;
  isHost: boolean;
  boardExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function PhaseStatusBar({
  gameState,
  onNextRound,
  isHost,
  boardExpanded = false,
  onToggleExpand,
}: PhaseStatusBarProps) {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const alive = gameState.players.filter((p) => !p.isEliminated).length;

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-3xl px-5 py-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">
          Phase : {gameState.phase}
        </span>
        <h2 className="text-xl font-serif font-normal text-zinc-100 mt-1 tracking-wide">
          {gameState.phase === "PLACING" && `Tour de ${activePlayer.name} (Pose ou Enchère)`}
          {gameState.phase === "BIDDING" && `Enchères en cours... Tour de ${activePlayer.name}`}
          {gameState.phase === "REVEALING" && (
            <>
              Défie lancé par{" "}
              <span className="text-amber-400 font-black">
                {gameState.players.find((p) => p.id === gameState.bidWinnerId)?.name}
              </span>{" "}
              ({gameState.revealedCards.length} / {gameState.cardsToReveal} révélées)
            </>
          )}
          {gameState.phase === "ROUND_END" && "Fin de la manche"}
          {gameState.phase === "GAME_OVER" && "Partie Terminée !"}
        </h2>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800 font-mono text-xs text-rose-300/80">
          {alive} en lice
        </span>
        {gameState.phase === "ROUND_END" &&
          (isHost ? (
            <button
              type="button"
              onClick={onNextRound}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-zinc-950 font-bold transition-all shadow-lg shadow-rose-500/20"
            >
              Lancer la manche suivante
            </button>
          ) : (
            <span className="text-sm text-zinc-400 animate-pulse italic">
              En attente du lancement par l'Hôte...
            </span>
          ))}
        {onToggleExpand && (
          <ExpandToggle
            expanded={boardExpanded}
            onToggle={onToggleExpand}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950/90 text-zinc-200 hover:border-rose-400/60 transition-all"
          />
        )}
      </div>
    </div>
  );
}
