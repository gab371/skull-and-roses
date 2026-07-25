import { usePeer as useCorePeer, type PeerManagerLike } from "p2play-core";
import type { GameState } from "../core/types";
import { soundManager } from "../core/soundFX";

interface UsePeerOptions {
  externalPeerManager?: PeerManagerLike<GameState>;
}

export function usePeer(options?: UsePeerOptions) {
  return useCorePeer<GameState>({
    externalPeerManager: options?.externalPeerManager,
    namespacePrefix: "skull",
    sounds: {
      card: () => soundManager.playCard(),
      bid: () => soundManager.playBid(),
      skullthud: () => soundManager.playSkullThud(),
      victory: () => soundManager.playVictory(),
      defeat: () => soundManager.playDefeat(),
      click: () => soundManager.playClick(),
      ping: () => soundManager.playPing(),
    },
  });
}
