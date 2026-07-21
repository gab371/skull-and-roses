import type { Card } from "../../core/types";

interface HandPanelProps {
  hand: Card[];
  onPlaceCard: (uid: string) => void;
  isMyTurn: boolean;
  canPlace: boolean;
}

export function HandPanel({ hand, onPlaceCard, isMyTurn, canPlace }: HandPanelProps) {
  if (!isMyTurn) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 text-center text-sm text-zinc-500">
        En attente de votre tour...
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-3xl p-5 shadow-xl">
      <div className="text-center mb-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Votre Main</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          {canPlace ? "Sélectionnez une carte à poser face cachée sur votre pile." : "Vous devez lancer les enchères, aucun dépôt possible."}
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {hand.map((card) => (
          <button
            key={card.uid}
            onClick={() => onPlaceCard(card.uid)}
            disabled={!canPlace}
            className={`w-20 h-28 rounded-2xl flex flex-col items-center justify-between p-3 border font-bold transition-all relative group overflow-hidden ${
              canPlace
                ? card.type === 'SKULL'
                  ? "bg-gradient-to-br from-zinc-850 to-zinc-900 border-rose-500/30 hover:border-rose-500 text-rose-500 hover:scale-105 hover:shadow-lg hover:shadow-rose-950/20"
                  : "bg-gradient-to-br from-zinc-850 to-zinc-900 border-amber-500/30 hover:border-amber-500 text-amber-500 hover:scale-105 hover:shadow-lg hover:shadow-amber-950/20"
                : "bg-zinc-900 border-zinc-850 text-zinc-600 cursor-not-allowed opacity-50"
            }`}
          >
            {/* Holographic grid light lines */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-700/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <span className="text-xs self-start uppercase tracking-wider font-mono opacity-60">
              {card.type === 'SKULL' ? "Skull" : "Rose"}
            </span>
            <span className="text-3xl my-auto animate-pulse">
              {card.type === 'SKULL' ? "💀" : "🌹"}
            </span>
            <span className="text-[10px] self-end opacity-60 font-mono">
              SKULL &copy;
            </span>
          </button>
        ))}

        {hand.length === 0 && (
          <div className="text-sm text-zinc-500 py-6">Plus de cartes en main !</div>
        )}
      </div>
    </div>
  );
}
