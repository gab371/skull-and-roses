import { useState, useEffect } from "react";

interface AuctionPanelProps {
  highestBid: number;
  totalPlaced: number;
  isMyTurn: boolean;
  phase: 'PLACING' | 'BIDDING';
  onStartBid: (amount: number) => void;
  onRaiseBid: (amount: number) => void;
  onPass: () => void;
}

export function AuctionPanel({
  highestBid,
  totalPlaced,
  isMyTurn,
  phase,
  onStartBid,
  onRaiseBid,
  onPass,
}: AuctionPanelProps) {
  const [bidValue, setBidValue] = useState(highestBid + 1);

  // Keep state sync
  useEffect(() => {
    setBidValue(highestBid + 1);
  }, [highestBid]);

  if (!isMyTurn) return null;

  const handleAction = () => {
    if (phase === 'PLACING') {
      onStartBid(bidValue);
    } else {
      onRaiseBid(bidValue);
    }
  };

  const increment = () => {
    if (bidValue < totalPlaced) setBidValue((v) => v + 1);
  };

  const decrement = () => {
    if (bidValue > highestBid + 1) setBidValue((v) => v - 1);
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-center md:text-left">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Enchères</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          {highestBid > 0 ? `L'enchère actuelle est de ${highestBid}. Surenchérissez ou passez.` : "Lancez les enchères en choisissant le nombre de cartes à retourner."}
        </p>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="flex items-center bg-zinc-950 border border-zinc-850 rounded-2xl p-1.5 w-full md:w-44 justify-between">
          <button
            onClick={decrement}
            disabled={bidValue <= highestBid + 1}
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            -
          </button>
          <span className="font-extrabold text-2xl px-4 text-zinc-100 font-mono">{bidValue}</span>
          <button
            onClick={increment}
            disabled={bidValue >= totalPlaced}
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            +
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleAction}
            className="flex-grow md:flex-none py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-zinc-950 font-bold transition-all shadow-lg shadow-rose-500/10"
          >
            {phase === 'PLACING' ? "Lancer" : "Surenchérir"}
          </button>

          {phase === 'BIDDING' && (
            <button
              onClick={onPass}
              className="py-3.5 px-6 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-all border border-zinc-750"
            >
              Passer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
