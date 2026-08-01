import type { Card } from "../../core/types";

export type SkullFaceMode = "hand" | "pile-hidden" | "pile-owner" | "pile-revealed";

interface SkullCardFaceProps {
  card?: Card;
  type?: "SKULL" | "ROSE";
  mode?: SkullFaceMode;
  faceDown?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

function faceType(card: Card | undefined, type?: "SKULL" | "ROSE"): "SKULL" | "ROSE" {
  return type ?? card?.type ?? "ROSE";
}

export function SkullCardFace({
  card,
  type,
  mode = "hand",
  faceDown = false,
  disabled = false,
  onClick,
  className = "",
  compact = false,
}: SkullCardFaceProps) {
  const kind = faceType(card, type);
  const isSkull = kind === "SKULL";
  const size = compact ? "w-14 h-20 rounded-xl" : "w-20 h-28 rounded-2xl";

  if (faceDown || mode === "pile-hidden") {
    return (
      <button
        type="button"
        disabled={disabled || !onClick}
        onClick={onClick}
        className={`${size} relative flex flex-col items-center justify-center border-2 select-none transition-all duration-200
          bg-gradient-to-br from-[#2a1218] via-[#1a0a0f] to-[#0c0608]
          border-rose-900/50 text-rose-300/70 shadow-md shadow-black/50
          ${onClick && !disabled ? "hover:-translate-y-1 hover:border-rose-500/60 cursor-pointer" : "cursor-default"}
          ${className}`}
      >
        <span className="font-serif text-lg opacity-80">☠</span>
        <span className="text-[8px] uppercase tracking-widest mt-1 opacity-50">S&R</span>
      </button>
    );
  }

  const material = isSkull
    ? mode === "pile-revealed"
      ? "bg-gradient-to-b from-[#5c1018] to-[#2a060a] border-red-500 text-white shadow-lg shadow-red-950/40"
      : "bg-gradient-to-b from-[#e8e0d0] to-[#c4b8a0] border-[#8a7a60] text-[#1a1210] shadow-md shadow-black/30"
    : mode === "pile-revealed"
      ? "bg-gradient-to-b from-amber-500 to-yellow-800 border-amber-400 text-white shadow-lg shadow-amber-950/40"
      : "bg-gradient-to-b from-[#fff1f2] to-[#fecdd3] border-rose-400/70 text-rose-900 shadow-md shadow-rose-950/20";

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`${size} relative flex flex-col items-center justify-between p-2 border-2 select-none transition-all duration-200 overflow-hidden
        ${material}
        ${onClick && !disabled ? "hover:-translate-y-2 hover:scale-105 cursor-pointer" : "cursor-default"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}`}
    >
      <span
        className={`text-[9px] self-start uppercase tracking-wider font-bold ${
          isSkull && mode !== "pile-revealed" ? "text-[#5c4030]/70" : "opacity-70"
        }`}
      >
        {isSkull ? "Skull" : "Rose"}
      </span>
      <span className={`${compact ? "text-xl" : "text-3xl"} my-auto drop-shadow-md leading-none`}>
        {isSkull ? "💀" : "🌹"}
      </span>
      <span
        className={`text-[8px] self-end font-serif tracking-wide ${
          isSkull && mode !== "pile-revealed" ? "text-[#5c4030]/60" : "opacity-60"
        }`}
      >
        S&R
      </span>
    </button>
  );
}
