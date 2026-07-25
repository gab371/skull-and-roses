import React from "react";
import type { GameState } from "../../core/types";

interface SpectatorViewProps {
  gameState: GameState;
  onDisconnect?: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  LOBBY: 'Salon',
  PLACING: 'Pose de cartes',
  BIDDING: 'Enchères',
  REVEALING: 'Révélation',
  ROUND_END: 'Fin de manche',
  GAME_OVER: 'Partie Terminée',
};

export const SpectatorView: React.FC<SpectatorViewProps> = ({ gameState, onDisconnect }) => {
  const active = gameState.players[gameState.activePlayerIndex];
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👁</span>
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-sky-300 bg-clip-text text-transparent">Mode Spectateur</h1>
            <p className="text-xs text-zinc-400">Vous observez la partie sans participer.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-full text-xs font-bold">
          {PHASE_LABELS[gameState.phase] || gameState.phase}
        </span>
      </div>

      {active && <p className="text-sm text-zinc-300 mb-4">Tour de : <strong>{active.name}</strong>{gameState.highestBid > 0 && <> · Enchère : {gameState.highestBid}</>}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {gameState.players.map((p) => (
          <div key={p.id} className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{p.avatar}</span>
                <span className="font-medium text-zinc-100">{p.name}</span>
                {p.id === active?.id && <span className="text-xs text-rose-400">▶ Tour</span>}
                {p.isEliminated && <span className="text-xs text-zinc-500">Éliminé</span>}
              </div>
              <span className="text-xs text-rose-300 font-mono">{p.score} 🏆</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Main : {p.hand.length} · Pile : {p.pile.length}{p.hasPassed && ' · Passé'}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 max-h-48 overflow-y-auto">
        <div className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Journal</div>
        <div className="space-y-1">
          {gameState.logs.slice(0, 12).map((l) => (
            <div key={l.id} className="text-[11px] text-zinc-300">
              <span className="text-zinc-500 font-mono mr-2">{l.timestamp}</span>{l.message}
            </div>
          ))}
          {gameState.logs.length === 0 && <div className="text-[11px] text-zinc-600">Aucun événement.</div>}
        </div>
      </div>

      {gameState.winnerId && (
        <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
          🏆 Vainqueur : <strong>{gameState.players.find(p => p.id === gameState.winnerId)?.name}</strong>
        </div>
      )}

      <div className="mt-6 text-center">
        <button onClick={onDisconnect} className="text-xs text-zinc-500 hover:text-zinc-300 underline transition-all">
          Quitter le salon
        </button>
      </div>
    </div>
  );
};
