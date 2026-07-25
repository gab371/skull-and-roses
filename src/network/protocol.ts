import type { GameState, Card, Player } from "../core/types";

export type MessageType = 'JOIN' | 'STATE_UPDATE' | 'ACTION' | 'CHAT' | 'AUDIO_EVENT';

export interface NetworkMessage {
  type: MessageType;
  [key: string]: any;
}

export interface ChatMessage extends NetworkMessage {
  type: 'CHAT';
  sender: string;
  text: string;
  time: string;
}

export interface StateUpdateMessage extends NetworkMessage {
  type: 'STATE_UPDATE';
  state: GameState;
}

export type ClientActionType =
  | 'PLACE_CARD'
  | 'START_BID'
  | 'RAISE_BID'
  | 'PASS'
  | 'REVEAL_CARD'
  | 'READY'
  | 'START_GAME';

export interface ActionMessage extends NetworkMessage {
  type: 'ACTION';
  actionName: ClientActionType;
  playerId: string;
  payload: any;
}

/**
 * Sanitizes the game state for a specific player before sending it over the network.
 * This prevents players from cheating by inspecting opponents' face-down cards in their hand or pile.
 */
export function sanitizeGameState(state: GameState, targetPlayerId: string): GameState {
  const sanitizedPlayers = state.players.map((player): Player => {
    // Current player's view of themselves
    if (player.id === targetPlayerId) {
      return {
        ...player,
        // The player can see their own hand and their own pile cards
        hand: player.hand.map(c => ({ ...c })),
        pile: player.pile.map(c => ({ ...c })),
      };
    }

    // Current player's view of opponents
    return {
      ...player,
      // Hide opponent's hand cards types (we only keep unique uids or mask them completely)
      hand: player.hand.map((_, index) => ({
        uid: `hidden_hand_${player.id}_${index}`,
        type: 'ROSE', // Mask as default
      } as Card)),
      // Hide opponent's pile cards types, unless they have been revealed
      pile: player.pile.map((card, index) => {
        const isRevealed = state.revealedCards.some(rc => rc.cardUid === card.uid);
        if (isRevealed) {
          return { ...card };
        }
        return {
          uid: `hidden_pile_${player.id}_${index}`,
          type: 'ROSE', // Mask as default
        } as Card;
      }),
    };
  });

  return {
    ...state,
    players: sanitizedPlayers,
  };
}

/**
 * Sanitizes the game state for a spectator.
 * Spectators never see any face-down hand or pile card types (only revealed pile cards).
 */
export function sanitizeGameStateForSpectator(state: GameState): GameState {
  const sanitizedPlayers = state.players.map((player): Player => ({
    ...player,
    hand: player.hand.map((_, index) => ({
      uid: `hidden_hand_${player.id}_${index}`,
      type: 'ROSE',
    } as Card)),
    pile: player.pile.map((card, index) => {
      const isRevealed = state.revealedCards.some(rc => rc.cardUid === card.uid);
      if (isRevealed) return { ...card };
      return {
        uid: `hidden_pile_${player.id}_${index}`,
        type: 'ROSE',
      } as Card;
    }),
  }));

  return {
    ...state,
    players: sanitizedPlayers,
  };
}
