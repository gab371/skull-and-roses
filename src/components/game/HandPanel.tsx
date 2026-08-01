import type { Card } from "../../core/types";
import { SkullCardFace } from "./SkullCardFace";

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
          {canPlace
            ? "Sélectionnez une carte à poser face cachée sur votre pile."
            : "Vous devez lancer les enchères, aucun dépôt possible."}
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {hand.map((card) => (
          <SkullCardFace
            key={card.uid}
            card={card}
            mode="hand"
            disabled={!canPlace}
            onClick={canPlace ? () => onPlaceCard(card.uid) : undefined}
          />
        ))}

        {hand.length === 0 && (
          <div className="text-sm text-zinc-500 py-6">Plus de cartes en main !</div>
        )}
      </div>
    </div>
  );
}
