export type CardType = 'ROSE' | 'SKULL';

export interface Card {
  uid: string;
  type: CardType;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  score: number; // Wins a point on each successful bid (2 to win the game)
  hand: Card[]; // The cards currently held in hand
  pile: Card[]; // The stack of cards currently placed face-down on their board
  hasPassed: boolean; // Flag to track if the player has passed during the bidding phase
  isEliminated: boolean; // True if the player has lost all 4 cards
}

export type GamePhase =
  | 'LOBBY'
  | 'PLACING'
  | 'BIDDING'
  | 'REVEALING'
  | 'ROUND_END'
  | 'GAME_OVER';

export interface GameLog {
  id: string;
  timestamp: string;
  message: string;
  type:
    | 'info'
    | 'system'
    | 'warning'
    | 'phase'
    | 'place'
    | 'bid'
    | 'pass'
    | 'reveal-rose'
    | 'reveal-skull'
    | 'success'
    | 'failure'
    | 'elimination'
    | 'victory';
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  activePlayerIndex: number; // Whose turn it is (placing, bidding, or revealing)
  bidWinnerId: string | null; // The player who won the auction
  highestBid: number; // The current highest bid amount
  cardsToReveal: number; // The target number of cards to reveal (equal to the winning bid)
  revealedCards: { cardUid: string; playerId: string; type: CardType }[]; // Cards revealed in the current round
  logs: GameLog[];
  winnerId: string | null; // The game winner, if any
}
