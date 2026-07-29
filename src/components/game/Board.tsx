import type { GameState, Card } from "../../core/types";
import { Badge } from "p2play-core/ui";

interface BoardProps {
  gameState: GameState;
  myPeerId: string | null;
  onRevealCard: (targetPlayerId: string) => void;
  onNextRound: () => void;
  isHost: boolean;
}

export function Board({
  gameState,
  myPeerId,
  onRevealCard,
  onNextRound,
  isHost,
}: BoardProps) {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
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

  const getPlayerCardStyles = (card: Card, isOwner: boolean) => {
    const isRevealed = gameState.revealedCards.some((rc) => rc.cardUid === card.uid);

    if (isRevealed) {
      return card.type === 'SKULL'
        ? "bg-gradient-to-br from-red-600 to-rose-900 border-red-500 text-white shadow-lg shadow-red-950/40"
        : "bg-gradient-to-br from-amber-600 to-yellow-800 border-amber-500 text-white shadow-lg shadow-amber-950/40";
    }

    if (isOwner) {
      // Owner sees what cards they placed in their own pile
      return card.type === 'SKULL'
        ? "bg-zinc-800/80 border-rose-500/40 text-rose-500/80"
        : "bg-zinc-800/80 border-amber-500/40 text-amber-500/80";
    }

    // Default face down card look for opponents
    return "bg-gradient-to-br from-zinc-800 to-zinc-950 border-zinc-700 text-zinc-650";
  };

  return (
    <div className="space-y-6">
      {/* Round / Phase Info Bar */}
      <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">
            Phase : {gameState.phase}
          </span>
          <h2 className="text-xl font-extrabold text-zinc-100 mt-1">
            {gameState.phase === 'PLACING' && `Tour de ${activePlayer.name} (Pose ou Enchère)`}
            {gameState.phase === 'BIDDING' && `Enchères en cours... Tour de ${activePlayer.name}`}
            {gameState.phase === 'REVEALING' && (
              <>
                Défie lancé par{" "}
                <span className="text-amber-400 font-black">
                  {gameState.players.find((p) => p.id === gameState.bidWinnerId)?.name}
                </span>{" "}
                ({gameState.revealedCards.length} / {gameState.cardsToReveal} révélées)
              </>
            )}
            {gameState.phase === 'ROUND_END' && "Fin de la manche"}
            {gameState.phase === 'GAME_OVER' && "Partie Terminée !"}
          </h2>
        </div>

        {gameState.phase === 'ROUND_END' && (
          <div>
            {isHost ? (
              <button
                onClick={onNextRound}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-zinc-950 font-bold transition-all shadow-lg shadow-rose-500/20"
              >
                Lancer la manche suivante
              </button>
            ) : (
              <span className="text-sm text-zinc-400 animate-pulse italic">
                En attente du lancement par l'Hôte...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Players Mats Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  // Calculate overlaps
                  const offset = cIdx * 12;

                  return (
                    <div
                      key={card.uid}
                      style={{
                        transform: `translateX(${offset}px) scale(${1 - (player.pile.length - cIdx - 1) * 0.05})`,
                        zIndex: cIdx,
                      }}
                      className={`w-14 h-20 rounded-xl border-2 flex flex-col items-center justify-center font-bold text-lg transition-all absolute shadow-md ${getPlayerCardStyles(
                        card,
                        player.id === myPeerId
                      )}`}
                    >
                      {isRevealed ? (
                        <span>{card.type === 'SKULL' ? "💀" : "🌹"}</span>
                      ) : player.id === myPeerId ? (
                        <div className="flex flex-col items-center leading-none">
                          <span className="text-xs">{card.type === 'SKULL' ? "💀" : "🌹"}</span>
                          <span className="text-[7px] text-zinc-500 mt-1 uppercase tracking-tighter">
                            {cIdx + 1}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">?</span>
                      )}
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
    </div>
  );
}
