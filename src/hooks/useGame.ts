import { useEffect, useRef, useState, useCallback } from "react";
import {
  attachPresenceHandlers,
  createSeatEngine,
  handleJoinGameSeat,
} from "p2play-core/presence";
import { usePeer } from "./usePeer";
import { SkullGameEngine } from "../core/gameEngine";
import { sanitizeGameState, sanitizeGameStateForSpectator } from "../network/protocol";
import type { NetworkMessage } from "../network/protocol";
import type { GameState } from "../core/types";
import { installTestHooks, registerEngineGetter } from "../testHooks";

interface UseGameOptions {
  externalPeerManager?: import("p2play-core").PeerManagerLike;
  playerName?: string;
  playerAvatar?: string;
  isEmbedded?: boolean;
  isHost?: boolean;
  lateJoin?: boolean;
  gameConfig?: any;
  hubPhase?: string;
}

export function useGame(options?: UseGameOptions) {
  const p2p = usePeer(options);
  const {
    isHost,
    myPeerId,
    peerManager,
    playSfx,
    hostGame,
    joinGame,
    sendAction,
    sendChat,
    gameState,
    status,
    error,
    chatMessages,
    disconnect
  } = p2p;

  const gameEngineRef = useRef<SkullGameEngine | null>(null);
  const victoryPlayedRef = useRef<boolean>(false);

  // Expose test hooks (dev/test builds only) for E2E determinism.
  // No-op in production (installTestHooks gates on import.meta.env.PROD).
  useEffect(() => {
    registerEngineGetter(() => gameEngineRef.current);
    installTestHooks();
  }, []);

  const [localPlayerName, setLocalPlayerName] = useState<string>(options?.playerName || "");
  const [localPlayerAvatar, setLocalPlayerAvatar] = useState<string>(options?.playerAvatar || "💀");

  // Helper function to broadcast sanitized states to each player
  const broadcastSanitizedStates = useCallback((engineState: GameState, overridePeerId?: string) => {
    const activePeerId = overridePeerId || myPeerId;
    if (!activePeerId) return;

    const sent = new Set<string>([activePeerId]);
    const resolveConn = (id: string) => {
      let conn = peerManager.connections.get(id);
      if (!conn) {
        for (const [peerId, connection] of peerManager.connections.entries()) {
          if (peerId.endsWith(id) || id.endsWith(peerId)) {
            conn = connection;
            break;
          }
        }
      }
      return conn;
    };

    const hostSanitized = sanitizeGameState(engineState, activePeerId);
    p2p.peerManager.onStateReceived?.(JSON.parse(JSON.stringify(hostSanitized)));

    engineState.players.forEach((p) => {
      if (p.id === activePeerId) return;
      const conn = resolveConn(p.id);
      if (conn && conn.open) {
        conn.send({ type: 'STATE_UPDATE', state: sanitizeGameState(engineState, p.id) });
        sent.add(p.id);
      }
    });

    const spectatorView = sanitizeGameStateForSpectator(engineState);
    engineState.spectators.forEach((s) => {
      const conn = resolveConn(s.id);
      if (conn && conn.open) {
        conn.send({ type: 'STATE_UPDATE', state: JSON.parse(JSON.stringify(spectatorView)) });
        sent.add(s.id);
      }
    });

    peerManager.connections.forEach((conn, peerId) => {
      if (!conn.open || sent.has(peerId)) return;
      const alreadyKnown =
        engineState.players.some((p) => p.id === peerId || peerId.endsWith(p.id) || p.id.endsWith(peerId)) ||
        engineState.spectators.some((s) => s.id === peerId || peerId.endsWith(s.id) || s.id.endsWith(peerId));
      if (alreadyKnown) return;
      conn.send({ type: 'STATE_UPDATE', state: JSON.parse(JSON.stringify(spectatorView)) });
    });
  }, [myPeerId, peerManager, p2p.peerManager]);

  // Host Action Handler & Embedded Auto-Start
  useEffect(() => {
    if (!isHost) {
      gameEngineRef.current = null;
      return;
    }

    if (!gameEngineRef.current) {
      gameEngineRef.current = new SkullGameEngine();
    }

    const engine = gameEngineRef.current;

    // Embedded setup: populate players from the Hub lobby but STAY in LOBBY
    // so the host can pick roles (Joueur / Spectateur) before clicking "Lancer la Partie".
    if (options?.isEmbedded && options?.externalPeerManager && engine.state.phase === 'LOBBY') {
      setTimeout(() => {
        engine.state.players = [];
        const hostName = options.playerName || "Hôte";
        const hostAvatar = options.playerAvatar || "💀";
        engine.addPlayer(myPeerId!, hostName, hostAvatar, true);

        if ((peerManager as any).lobbyPlayers) {
          (peerManager as any).lobbyPlayers.forEach((p: any) => {
            if (p.peerId && p.peerId !== myPeerId) {
              engine.addPlayer(p.peerId, p.username || `Joueur ${p.peerId.slice(0, 4)}`, p.avatar || "👤", false);
            }
          });
        }

        // Do NOT auto-start: broadcast the LOBBY state so the role-selection
        // lobby + "Lancer la Partie" shows for everyone.
        broadcastSanitizedStates(engine.state);
      }, 0);
    }

    const getSeatEngine = () =>
      createSeatEngine({
        getPhase: () => engine.state.phase,
        getPlayers: () => engine.state.players,
        getSpectators: () => engine.state.spectators,
        markDisconnected: (id) => engine.markDisconnected(id),
        isDisconnected: (id) => engine.isDisconnected(id),
        remapPlayerId: (o, n, p) => engine.remapPlayerId(o, n, p),
        removePlayer: (id) => engine.removePlayer(id),
      });

    const presence = attachPresenceHandlers({
      peerManager,
      getEngine: getSeatEngine,
      onBroadcast: () => broadcastSanitizedStates(engine.state),
      onHostAction: (_senderPeerId, actionMsg) => {
        const msg = actionMsg as NetworkMessage;
        if (msg.type !== "ACTION") return;
        const { actionName, playerId, payload } = msg;

        switch (actionName) {
          case "JOIN_GAME": {
            handleJoinGameSeat({
              engine: getSeatEngine(),
              playerId,
              payload: { name: payload?.name, avatar: payload?.avatar },
              isHostPlayer: playerId === myPeerId,
              addPlayer: (id, name, avatar, isHost) =>
                engine.addPlayer(id, name, avatar, isHost),
              addSpectator: (id, name, avatar) =>
                engine.addSpectator(id, name, avatar),
            });
            break;
          }

          case "TOGGLE_READY":
            engine.setPlayerReady(playerId, payload.readyStatus);
            const p = engine.state.players.find((pl) => pl.id === playerId);
            if (p) {
              engine.addLog(
                `${p.name} est ${payload.readyStatus ? "prêt !" : "en attente..."}`,
                "info",
              );
            }
            break;

          case "START_GAME":
            if (playerId === myPeerId) {
              engine.startGame();
            }
            break;

          case "SET_ROLE": {
            const requesterIsHost = playerId === myPeerId;
            const targetId = payload.peerId as string;
            const nextRole = payload.role as "player" | "spectator";
            if (requesterIsHost || targetId === playerId) {
              engine.setPlayerRole(targetId, nextRole, {
                requesterPeerId: playerId,
                requesterIsHost,
              });
            }
            break;
          }

          case "LOCK_SPECTATOR":
            if (playerId === myPeerId) {
              const targetId = payload.peerId as string;
              const locked = !!payload.locked;
              if (locked) {
                engine.setPlayerRole(targetId, "spectator", {
                  requesterPeerId: playerId,
                  requesterIsHost: true,
                });
              }
              engine.setSpectatorLock(targetId, locked);
            }
            break;

          case "PLACE_CARD":
            engine.placeCard(playerId, payload.cardUid);
            playSfx("card");
            break;

          case "START_BID":
            engine.startBid(playerId, payload.amount);
            playSfx("bid");
            break;

          case "RAISE_BID":
            engine.raiseBid(playerId, payload.amount);
            playSfx("bid");
            break;

          case "PASS":
            engine.passBid(playerId);
            playSfx("click");
            break;

          case "REVEAL_CARD":
            engine.revealCard(playerId, payload.targetPlayerId);
            {
              // The engine pushed the revealed card at the end of revealedCards.
              const lastReveal = engine.state.revealedCards[engine.state.revealedCards.length - 1];
              if (lastReveal && lastReveal.type === "SKULL") {
                playSfx("skullthud");
              } else {
                playSfx("card");
              }
            }
            break;

          case "NEXT_ROUND":
            engine.startNextRound();
            playSfx("click");
            break;
        }

        broadcastSanitizedStates(engine.state);

        // Victory fanfare once when the game ends (broadcast to all peers).
        if (engine.state.phase === "GAME_OVER" && !victoryPlayedRef.current) {
          victoryPlayedRef.current = true;
          playSfx("victory");
        } else if (engine.state.phase !== "GAME_OVER") {
          victoryPlayedRef.current = false;
        }
      },
    });

    return () => {
      presence.dispose();
    };
  }, [isHost, myPeerId, peerManager, playSfx, broadcastSanitizedStates]);

  // Embedded guests must announce themselves to the host engine.
  useEffect(() => {
    if (!options?.isEmbedded || isHost || !myPeerId) return;
    const name = options.playerName || localPlayerName || "Joueur";
    const avatar = options.playerAvatar || localPlayerAvatar || "👤";
    const sendJoin = () => {
      peerManager.sendToHost("ACTION", {
        actionName: "JOIN_GAME",
        playerId: myPeerId,
        payload: { name, avatar },
      });
    };
    const t1 = window.setTimeout(sendJoin, 250);
    const t2 = window.setTimeout(sendJoin, 1000);
    const t3 = window.setTimeout(sendJoin, 2500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [
    options?.isEmbedded,
    options?.playerName,
    options?.playerAvatar,
    isHost,
    myPeerId,
    localPlayerName,
    localPlayerAvatar,
    peerManager,
  ]);

  // Client triggers
  const hostRoom = useCallback(async (name: string, avatar: string) => {
    setLocalPlayerName(name);
    setLocalPlayerAvatar(avatar);
    const roomId = await hostGame(undefined, { username: name, avatar });
    const engine = new SkullGameEngine();
    gameEngineRef.current = engine;
    engine.addPlayer(roomId, name, avatar, true);
    broadcastSanitizedStates(engine.state, roomId);
  }, [hostGame, broadcastSanitizedStates]);

  const joinRoom = useCallback(async (name: string, avatar: string, roomId: string) => {
    setLocalPlayerName(name);
    setLocalPlayerAvatar(avatar);
    const { peerId } = await joinGame(roomId, { username: name, avatar });
    setTimeout(() => {
      peerManager.sendToHost('ACTION', {
        actionName: 'JOIN_GAME',
        playerId: peerId,
        payload: { name, avatar },
      });
    }, 1000);
  }, [joinGame, peerManager]);

  const toggleReady = useCallback((readyStatus: boolean) => {
    sendAction('TOGGLE_READY', { readyStatus });
  }, [sendAction]);

  const startGame = useCallback(() => {
    sendAction('START_GAME', {});
  }, [sendAction]);

  const setRole = useCallback((peerId: string, role: 'player' | 'spectator') => {
    sendAction('SET_ROLE', { peerId, role });
  }, [sendAction]);

  const lockSpectator = useCallback((peerId: string, locked: boolean) => {
    sendAction('LOCK_SPECTATOR', { peerId, locked });
  }, [sendAction]);

  const placeCard = useCallback((cardUid: string) => {
    sendAction('PLACE_CARD', { cardUid });
  }, [sendAction]);

  const startBid = useCallback((amount: number) => {
    sendAction('START_BID', { amount });
  }, [sendAction]);

  const raiseBid = useCallback((amount: number) => {
    sendAction('RAISE_BID', { amount });
  }, [sendAction]);

  const passBid = useCallback(() => {
    sendAction('PASS', {});
  }, [sendAction]);

  const revealCard = useCallback((targetPlayerId: string) => {
    sendAction('REVEAL_CARD', { targetPlayerId });
  }, [sendAction]);

  const nextRound = useCallback(() => {
    sendAction('NEXT_ROUND', {});
  }, [sendAction]);

  const sendChatMessage = useCallback((text: string) => {
    sendChat(localPlayerName || "Challenger", text);
  }, [sendChat, localPlayerName]);

  return {
    isHost,
    myPeerId,
    hostPeerId: p2p.hostPeerId,
    connectedPeers: p2p.connectedPeers,
    chatMessages,
    gameState,
    status,
    error,
    hostRoom,
    joinRoom,
    toggleReady,
    startGame,
    setRole,
    lockSpectator,
    placeCard,
    startBid,
    raiseBid,
    passBid,
    revealCard,
    nextRound,
    sendChatMessage,
    disconnect,
    localPlayerName,
    localPlayerAvatar,
  };
}
