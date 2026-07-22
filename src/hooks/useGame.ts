import { useEffect, useRef, useState, useCallback } from "react";
import { usePeer } from "./usePeer";
import { SkullGameEngine } from "../core/gameEngine";
import { sanitizeGameState } from "../network/protocol";
import type { NetworkMessage } from "../network/protocol";
import type { GameState } from "../core/types";

interface UseGameOptions {
  externalPeerManager?: any;
  playerName?: string;
  playerAvatar?: string;
  isEmbedded?: boolean;
}

export function useGame(options?: UseGameOptions) {
  const p2p = usePeer(options);
  const {
    isHost,
    myPeerId,
    peerManager,
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
  const [localPlayerName, setLocalPlayerName] = useState<string>(options?.playerName || "");
  const [localPlayerAvatar, setLocalPlayerAvatar] = useState<string>(options?.playerAvatar || "💀");

  // Helper function to broadcast sanitized states to each player
  const broadcastSanitizedStates = useCallback((engineState: GameState, overridePeerId?: string) => {
    const activePeerId = overridePeerId || myPeerId;
    if (!activePeerId) return;

    // Send state to local host state
    const hostSanitized = sanitizeGameState(engineState, activePeerId);
    p2p.peerManager.onStateReceived?.(JSON.parse(JSON.stringify(hostSanitized)));

    // Send customized sanitized state to each connected player
    engineState.players.forEach((p) => {
      if (p.id !== activePeerId) {
        // Find connection by player id
        let conn = peerManager.connections.get(p.id);
        // Fallback: search connections for matching peer id
        if (!conn) {
          for (const [peerId, connection] of peerManager.connections.entries()) {
            // Check if connection peer name matches namespaced target
            if (peerId.endsWith(p.id) || p.id.endsWith(peerId)) {
              conn = connection;
              break;
            }
          }
        }
        if (conn && conn.open) {
          const clientSanitized = sanitizeGameState(engineState, p.id);
          conn.send({ type: 'STATE_UPDATE', state: clientSanitized });
        }
      }
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

    // Auto start embedded game
    if (options?.isEmbedded && options?.externalPeerManager && engine.state.phase === 'LOBBY') {
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

      engine.startGame();
      broadcastSanitizedStates(engine.state);
    }

    peerManager.hostActionHandler = (_senderPeerId: string, actionMsg: NetworkMessage) => {
      if (actionMsg.type === 'ACTION') {
        const { actionName, playerId, payload } = actionMsg;

        switch (actionName) {
          case 'JOIN_GAME':
            engine.addPlayer(playerId, payload.name, payload.avatar, playerId === myPeerId);
            break;

          case 'TOGGLE_READY':
            engine.setPlayerReady(playerId, payload.readyStatus);
            const p = engine.state.players.find((pl) => pl.id === playerId);
            if (p) {
              engine.addLog(`${p.name} est ${payload.readyStatus ? 'prêt !' : 'en attente...'}`, 'info');
            }
            break;

          case 'START_GAME':
            if (playerId === myPeerId) {
              engine.startGame();
            }
            break;

          case 'PLACE_CARD':
            engine.placeCard(playerId, payload.cardUid);
            break;

          case 'START_BID':
            engine.startBid(playerId, payload.amount);
            break;

          case 'RAISE_BID':
            engine.raiseBid(playerId, payload.amount);
            break;

          case 'PASS':
            engine.passBid(playerId);
            break;

          case 'REVEAL_CARD':
            engine.revealCard(playerId, payload.targetPlayerId);
            break;

          case 'NEXT_ROUND':
            engine.startNextRound();
            break;
        }

        broadcastSanitizedStates(engine.state);
      }
    };

    peerManager.onPeerStatusChange = (peerId: string, peerStatus: 'CONNECTED' | 'DISCONNECTED') => {
      if (peerStatus === 'DISCONNECTED') {
        engine.removePlayer(peerId);
        broadcastSanitizedStates(engine.state);
      }
    };

    return () => {
      peerManager.hostActionHandler = null;
      peerManager.onPeerStatusChange = null;
    };
  }, [isHost, myPeerId, peerManager, broadcastSanitizedStates]);

  // Client triggers
  const hostRoom = useCallback(async (name: string, avatar: string) => {
    setLocalPlayerName(name);
    setLocalPlayerAvatar(avatar);
    const roomId = await hostGame();
    const engine = new SkullGameEngine();
    gameEngineRef.current = engine;
    engine.addPlayer(roomId, name, avatar, true);
    broadcastSanitizedStates(engine.state, roomId);
  }, [hostGame, broadcastSanitizedStates]);

  const joinRoom = useCallback(async (name: string, avatar: string, roomId: string) => {
    setLocalPlayerName(name);
    setLocalPlayerAvatar(avatar);
    const id = await joinGame(roomId);
    setTimeout(() => {
      peerManager.sendToHost('ACTION', {
        actionName: 'JOIN_GAME',
        playerId: id,
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
