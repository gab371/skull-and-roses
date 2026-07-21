import type { GameState, Player, GameLog } from "./types";

export class SkullGameEngine {
  public state: GameState;

  constructor() {
    this.state = this.createInitialState();
  }

  public createInitialState(): GameState {
    return {
      phase: 'LOBBY',
      players: [],
      activePlayerIndex: 0,
      bidWinnerId: null,
      highestBid: 0,
      cardsToReveal: 0,
      revealedCards: [],
      logs: [],
      winnerId: null,
    };
  }

  public addLog(message: string, type: GameLog['type'] = 'info'): void {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.state.logs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      message,
      type,
    });
    if (this.state.logs.length > 50) this.state.logs.pop();
  }

  public addPlayer(id: string, name: string, avatar?: string, isHost: boolean = false): boolean {
    if (this.state.phase !== 'LOBBY') return false;
    if (this.state.players.find(p => p.id === id)) return false;

    this.state.players.push({
      id,
      name,
      avatar: avatar || '💀',
      isHost,
      isReady: false,
      score: 0,
      hand: [],
      pile: [],
      hasPassed: false,
      isEliminated: false,
    });

    this.addLog(`${name} a rejoint la partie !`, 'system');
    return true;
  }

  public removePlayer(id: string): void {
    const index = this.state.players.findIndex(p => p.id === id);
    if (index !== -1) {
      const p = this.state.players[index];
      this.state.players.splice(index, 1);
      this.addLog(`${p.name} a quitté la partie.`, 'warning');
      if (this.state.players.length < 2 && this.state.phase !== 'LOBBY') {
        this.state.phase = 'LOBBY';
        this.addLog(`Pas assez de joueurs. Retour au lobby.`, 'warning');
      }
    }
  }

  public setPlayerReady(id: string, readyStatus: boolean): void {
    const p = this.state.players.find(p => p.id === id);
    if (p) p.isReady = readyStatus;
  }

  public startGame(): boolean {
    const activePlayers = this.state.players.filter(p => !p.isEliminated);
    if (activePlayers.length < 2) return false;

    this.state.phase = 'PLACING';
    this.state.winnerId = null;
    this.state.activePlayerIndex = 0;
    this.state.bidWinnerId = null;
    this.state.highestBid = 0;
    this.state.cardsToReveal = 0;
    this.state.revealedCards = [];

    this.state.players.forEach(p => {
      p.score = 0;
      p.isEliminated = false;
      p.hasPassed = false;
      p.pile = [];
      p.hand = [
        { uid: `${p.id}_rose_1`, type: 'ROSE' },
        { uid: `${p.id}_rose_2`, type: 'ROSE' },
        { uid: `${p.id}_rose_3`, type: 'ROSE' },
        { uid: `${p.id}_skull_1`, type: 'SKULL' },
      ];
    });

    this.addLog(`--- La partie commence ! Posez votre première carte ---`, 'phase');
    return true;
  }

  public getActivePlayer(): Player {
    return this.state.players[this.state.activePlayerIndex];
  }

  public advanceTurn(): void {
    const startIdx = this.state.activePlayerIndex;
    let nextIdx = (startIdx + 1) % this.state.players.length;

    while (nextIdx !== startIdx) {
      const p = this.state.players[nextIdx];
      if (!p.isEliminated && (!p.hasPassed || this.state.phase === 'PLACING')) {
        this.state.activePlayerIndex = nextIdx;
        return;
      }
      nextIdx = (nextIdx + 1) % this.state.players.length;
    }
  }

  // Action: PLACING
  public placeCard(playerId: string, cardUid: string): boolean {
    if (this.state.phase !== 'PLACING') return false;
    const player = this.getActivePlayer();
    if (player.id !== playerId) return false;

    const cardIdx = player.hand.findIndex(c => c.uid === cardUid);
    if (cardIdx === -1) return false;

    const [card] = player.hand.splice(cardIdx, 1);
    player.pile.push(card);

    this.addLog(`${player.name} a posé une carte face cachée.`, 'place');

    this.advanceTurn();
    return true;
  }

  // Action: START BID
  public startBid(playerId: string, amount: number): boolean {
    if (this.state.phase !== 'PLACING') return false;
    const player = this.getActivePlayer();
    if (player.id !== playerId) return false;

    // Check that every player has placed at least 1 card
    const anyEmpty = this.state.players.some(p => !p.isEliminated && p.pile.length === 0);
    if (anyEmpty) return false;

    const totalPlaced = this.state.players.reduce((sum, p) => sum + p.pile.length, 0);
    if (amount < 1 || amount > totalPlaced) return false;

    this.state.phase = 'BIDDING';
    this.state.highestBid = amount;
    this.state.bidWinnerId = player.id;
    this.state.players.forEach(p => (p.hasPassed = p.isEliminated));

    this.addLog(`${player.name} lance les enchères à ${amount}.`, 'bid');
    this.advanceTurn();
    return true;
  }

  // Action: RAISE BID
  public raiseBid(playerId: string, amount: number): boolean {
    if (this.state.phase !== 'BIDDING') return false;
    const player = this.getActivePlayer();
    if (player.id !== playerId) return false;

    const totalPlaced = this.state.players.reduce((sum, p) => sum + p.pile.length, 0);
    if (amount <= this.state.highestBid || amount > totalPlaced) return false;

    this.state.highestBid = amount;
    this.state.bidWinnerId = player.id;

    this.addLog(`${player.name} surenchérit à ${amount}.`, 'bid');
    this.advanceTurn();
    return true;
  }

  // Action: PASS BID
  public passBid(playerId: string): boolean {
    if (this.state.phase !== 'BIDDING') return false;
    const player = this.getActivePlayer();
    if (player.id !== playerId) return false;

    player.hasPassed = true;
    this.addLog(`${player.name} passe.`, 'pass');

    const activeBidders = this.state.players.filter(p => !p.isEliminated && !p.hasPassed);
    if (activeBidders.length === 1) {
      // Bidding ends! The remaining player is the bid winner.
      const winner = activeBidders[0];
      this.state.phase = 'REVEALING';
      this.state.bidWinnerId = winner.id;
      this.state.cardsToReveal = this.state.highestBid;
      this.state.revealedCards = [];
      
      const winnerIdx = this.state.players.findIndex(p => p.id === winner.id);
      this.state.activePlayerIndex = winnerIdx;

      this.addLog(`Fin des enchères. ${winner.name} doit révéler ${this.state.cardsToReveal} cartes.`, 'phase');
    } else {
      this.advanceTurn();
    }
    return true;
  }

  // Action: REVEAL CARD
  public revealCard(playerId: string, targetPlayerId: string): boolean {
    if (this.state.phase !== 'REVEALING') return false;
    if (this.state.bidWinnerId !== playerId) return false;

    const winner = this.getActivePlayer();
    const target = this.state.players.find(p => p.id === targetPlayerId);
    if (!target || target.isEliminated || target.pile.length === 0) return false;

    // RULE: The challenger must first reveal ALL of their own cards before revealing others.
    const winnerHasCardsLeft = winner.pile.length > 0;
    if (winnerHasCardsLeft && target.id !== winner.id) {
      return false; // Must flip own cards first!
    }

    // Flip the top card of target's pile
    const card = target.pile.pop();
    if (!card) return false;

    this.state.revealedCards.push({
      cardUid: card.uid,
      playerId: target.id,
      type: card.type,
    });

    if (card.type === 'SKULL') {
      this.addLog(`${winner.name} a révélé le CRÂNE de ${target.name} !`, 'reveal-skull');
      this.handleRoundFailure(winner, target);
    } else {
      this.addLog(`${winner.name} a révélé une ROSE chez ${target.name}.`, 'reveal-rose');
      
      if (this.state.revealedCards.length === this.state.cardsToReveal) {
        this.addLog(`${winner.name} a réussi son défi ! (+1 Point)`, 'success');
        winner.score += 1;
        
        if (winner.score >= 2) {
          this.state.winnerId = winner.id;
          this.state.phase = 'GAME_OVER';
          this.addLog(`${winner.name} remporte la victoire !`, 'victory');
        } else {
          this.endRound();
        }
      }
    }
    return true;
  }

  private handleRoundFailure(challenger: Player, skullOwner: Player): void {
    this.addLog(`Échec du défi pour ${challenger.name}.`, 'failure');

    // Retrieve all cards from piles to hands
    this.state.players.forEach(p => {
      p.hand.push(...p.pile);
      p.pile = [];
    });

    // Eliminate a random card from challenger's hand
    if (challenger.hand.length > 0) {
      const eliminatedIndex = Math.floor(Math.random() * challenger.hand.length);
      challenger.hand.splice(eliminatedIndex, 1);

      this.addLog(
        challenger.id === skullOwner.id
          ? `${challenger.name} a retourné son propre Crâne et perd une carte.`
          : `${skullOwner.name} élimine une carte au hasard de la main de ${challenger.name}.`,
        'elimination'
      );

      if (challenger.hand.length === 0) {
        challenger.isEliminated = true;
        this.addLog(`${challenger.name} n'a plus de cartes et est éliminé !`, 'elimination');
      }
    }

    // Check win condition by elimination
    const activePlayers = this.state.players.filter(p => !p.isEliminated);
    if (activePlayers.length === 1) {
      this.state.winnerId = activePlayers[0].id;
      this.state.phase = 'GAME_OVER';
      this.addLog(`${activePlayers[0].name} est le dernier survivant et gagne la partie !`, 'victory');
    } else {
      // Next round starts with the player who owned the skull (or the host if they were eliminated)
      const nextActiveIdx = this.state.players.findIndex(p => p.id === (skullOwner.isEliminated ? activePlayers[0].id : skullOwner.id));
      this.state.phase = 'ROUND_END';
      this.state.activePlayerIndex = nextActiveIdx;
    }
  }

  public endRound(): void {
    // Return cards to hands
    this.state.players.forEach(p => {
      p.hand.push(...p.pile);
      p.pile = [];
      p.hasPassed = p.isEliminated;
    });

    this.state.phase = 'ROUND_END';
  }

  public startNextRound(): boolean {
    if (this.state.phase !== 'ROUND_END') return false;
    this.state.phase = 'PLACING';
    this.state.highestBid = 0;
    this.state.bidWinnerId = null;
    this.state.cardsToReveal = 0;
    this.state.revealedCards = [];
    this.state.players.forEach(p => {
      p.hasPassed = p.isEliminated;
    });
    this.addLog(`--- Nouvelle manche ! Posez votre première carte ---`, 'phase');
    return true;
  }
}
