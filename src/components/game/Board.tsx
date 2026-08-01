import type { GameState } from "../../core/types";
import { Badge } from "p2play-core/ui";
import { SkullCardFace } from "./SkullCardFace";

interface BoardProps {
  gameState: GameState;
  myPeerId: string | null;
  onRevealCard: (targetPlayerId: string) => void;
  boardExpanded?: boolean;
}

export function Board({
  gameState,
  myPeerId,
  onRevealCard,
  boardExpanded = false,
}: BoardProps) {
  const myPlayer = gameState.players.find((p) => p.id === myPeerId);

  const canRevealThisPlayer = (targetPlayerId: string) => {
    if (gameState.phase !== 'REVEALING') return false;
    if (gameState.bidWinnerId !== myPeerId) return false;

    const target = gameState.players.find((p) => p.id === targetPlayerId);
    if (!target || target.isEliminated || target.pile.length === 0) return false;

    // RULE: The challenger must first reveal ALL of their own cards before revealing others.
    const myPileHasCards = myPlayer && myPlayer.pile.length > 0;
    if (myPileHasCards) {
      return targetPlayerId === myPeerId;
    }

    return true;
  };

  return (
    <div
      className={
        boardExpanded
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      }
    >
        {gameState.players.map((player, idx) => {
          const isCurrentActive = gameState.activePlayerIndex === idx && gameState.phase !== 'ROUND_END';
          const isWinner = gameState.bidWinnerId === player.id && gameState.phase === 'REVEALING';
          const canReveal = canRevealThisPlayer(player.id);
          const points = Array.from({ length: player.score });

          return (
            <div
              key={player.id}
              className={`rounded-3xl p-5 border transition-all flex flex-col justify-between relative overflow-hidden h-72 ${
                player.isEliminated
                  ? "bg-zinc-950/40 border-zinc-900 opacity-40"
                  : isCurrentActive
                  ? "bg-zinc-900/80 border-rose-500/50 shadow-lg shadow-rose-950/10"
                  : isWinner
                  ? "bg-zinc-900/80 border-amber-500/50 shadow-lg shadow-amber-950/10"
                  : "bg-zinc-900/40 border-zinc-800/80"
              }`}
            >
              {/* Header card with avatar & score */}
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-zinc-950 rounded-2xl border border-zinc-850">
                    {player.avatar}
                  </span>
                  <div>
                    <span className="font-extrabold text-zinc-100 flex items-center gap-1.5">
                      {player.name}
                      {player.id === myPeerId && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md">
                          Moi
                        </span>
                      )}
                      {player.disconnected && (
                        <Badge variant="destructive">Déconnecté</Badge>
                      )}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                      Cartes restantes : {player.hand.length + player.pile.length}
                    </span>
                  </div>
                </div>

                {/* Score indicators */}
                <div className="flex gap-1.5">
                  {points.map((_, pIdx) => (
                    <span
                      key={pIdx}
                      className="w-5 h-5 rounded-full bg-rose-500 border border-rose-400 flex items-center justify-center text-[10px] text-white shadow-md animate-bounce"
                      title="Points gagnés"
                    >
                      🌹
                    </span>
                  ))}
                  {player.score === 0 && (
                    <span className="text-zinc-700 text-xs font-mono">0 pts</span>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="my-3 flex flex-wrap gap-1.5 z-10">
                {player.isEliminated && (
                  <span className="whitespace-nowrap text-[10px] font-bold px-2.5 py-0.5 bg-rose-950/30 text-rose-500 border border-rose-900/40 rounded-full">
                    Éliminé
                  </span>
                )}
                {player.hasPassed && gameState.phase === 'BIDDING' && (
                  <span className="whitespace-nowrap text-[10px] font-bold px-2.5 py-0.5 bg-zinc-950 text-zinc-500 border border-zinc-850 rounded-full">
                    Passé
                  </span>
                )}
                {isCurrentActive && (
                  <span className="whitespace-nowrap text-[10px] font-bold px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full animate-pulse">
                    À son tour
                  </span>
                )}
                {isWinner && (
                  <span className="whitespace-nowrap text-[10px] font-bold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full animate-bounce">
                    Challenger ({gameState.highestBid})
                  </span>
                )}
              </div>

              {/* Cards Pile Stack */}
              <div className="flex-1 flex items-center justify-center relative mt-2 mb-4">
                {player.pile.map((card, cIdx) => {
                  const isRevealed = gameState.revealedCards.some(
                    (rc) => rc.cardUid === card.uid
                  );
                  const offset = cIdx * 12;
                  const isOwner = player.id === myPeerId;
                  const mode = isRevealed
                    ? "pile-revealed"
                    : isOwner
                      ? "pile-owner"
                      : "pile-hidden";

                  return (
                    <div
                      key={card.uid}
                      style={{
                        transform: `translateX(${offset}px) scale(${1 - (player.pile.length - cIdx - 1) * 0.05})`,
                        zIndex: cIdx,
                      }}
                      className="absolute transition-all"
                    >
                      <SkullCardFace
                        card={card}
                        mode={mode}
                        faceDown={!isRevealed && !isOwner}
                        compact
                      />
                    </div>
                  );
                })}

                {player.pile.length === 0 && (
                  <div className="text-zinc-700 text-xs italic font-mono">Tapis vide</div>
                )}
              </div>

              {/* Reveal Actions Trigger */}
              {canReveal && (
                <button
                  onClick={() => onRevealCard(player.id)}
                  className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all tracking-wider z-20 shadow-md shadow-rose-950/20"
                >
                  Révéler la carte du dessus
                </button>
              )}
            </div>
          );
        })}
    </div>
  );
}
