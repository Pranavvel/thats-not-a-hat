import { generateDeck } from './deck';
import {
  Card,
  GameSettings,
  GameState,
  PendingGift,
  PlayerState,
} from '../types';
import {
  advanceToNextPlayer,
  assertPhase,
  ensureCurrentPlayer,
  setPhase,
} from './stateMachine';

export interface GameRoomOptions {
  id: string;
  hostPlayerId: string;
  isPublic: boolean;
}

export class GameRoom {
  public readonly id: string;

  public readonly hostPlayerId: string;

  public readonly isPublic: boolean;

  public readonly createdAt: number;

  private players: PlayerState[] = [];

  private state: GameState;

  private deck: Card[] = [];

  constructor(options: GameRoomOptions) {
    this.id = options.id;
    this.hostPlayerId = options.hostPlayerId;
    this.isPublic = options.isPublic;
    this.createdAt = Date.now();

    const settings: GameSettings = {
      twoPlayerMode: false,
      multiRound: false,
      maxPenalty: 3,
    };

    this.state = {
      phase: 'lobby',
      roundNumber: 0,
      drawPile: [],
      discardPile: [],
      playersById: {},
      turnOrder: [],
      currentPlayerId: null,
      pendingGift: null,
      settings,
    };
  }

  getState(): GameState {
    return this.state;
  }

  getPlayers(): PlayerState[] {
    return this.players.slice();
  }

  addPlayer(playerId: string, name: string, avatar: string): PlayerState {
    if (this.state.phase !== 'lobby') {
      throw new Error('Cannot join: game already started.');
    }
    if (this.players.find((p) => p.id === playerId)) {
      throw new Error('Player already in room.');
    }

    const seatIndex = this.players.length;
    const player: PlayerState = {
      id: playerId,
      name,
      avatar,
      seatIndex,
      socketId: null,
      cardStack: [],
      penaltyCards: [],
      totalScore: 0,
      isConnected: true,
    };

    this.players.push(player);
    this.state.playersById[player.id] = player;
    this.state.turnOrder = this.players.map((p) => p.id);
    return player;
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter((p) => p.id !== playerId);
    delete this.state.playersById[playerId];
    this.state.turnOrder = this.players.map((p) => p.id);
  }

  startGame(options?: Partial<GameSettings>): void {
    if (this.players.length < 2) {
      throw new Error('Need at least 2 players to start.');
    }
    if (this.state.phase !== 'lobby') {
      throw new Error('Game already started.');
    }

    const mergedSettings: GameSettings = {
      ...this.state.settings,
      ...options,
    };
    this.state.settings = mergedSettings;

    this.deck = generateDeck();
    this.state.drawPile = this.deck.slice();
    this.state.discardPile = [];
    this.state.roundNumber = 1;
    this.state.turnOrder = this.players.map((p) => p.id);

    const initialCardCount = mergedSettings.twoPlayerMode ? 2 : 1;
    for (const player of this.players) {
      player.cardStack = [];
      player.penaltyCards = [];
      for (let i = 0; i < initialCardCount; i += 1) {
        const card = this.drawTopCard();
        if (!card) continue;
        player.cardStack.push({ cardId: card.id });
      }
    }

    // For now, just start with host; later we can encode \"last gift\"
    // selection or a random player according to rules.
    this.state.currentPlayerId = this.hostPlayerId;
    setPhase(this.state, 'draw_phase');
  }

  private drawTopCard(): Card | null {
    const card = this.state.drawPile.pop() ?? null;
    if (card) {
      this.deck = this.deck.filter((c) => c.id !== card.id);
    }
    return card;
  }

  private getCardById(cardId: string): Card {
    const all = [...this.state.drawPile, ...this.state.discardPile, ...this.deck];
    const card = all.find((c) => c.id === cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }
    return card;
  }

  handleDraw(playerId: string): { drawnCard: Card } {
    ensureCurrentPlayer(this.state, playerId);
    assertPhase(this.state, 'draw_phase');
    const card = this.drawTopCard();
    if (!card) {
      throw new Error('No cards left to draw.');
    }

    const player = this.state.playersById[playerId];
    if (!player) {
      throw new Error('Player not found.');
    }

    player.cardStack.push({ cardId: card.id });
    setPhase(this.state, 'declare_gift');

    return { drawnCard: card };
  }

  handleGiftDeclaration(playerId: string, declaredItemName: string): PendingGift {
    ensureCurrentPlayer(this.state, playerId);
    assertPhase(this.state, 'declare_gift');

    const player = this.state.playersById[playerId];
    if (!player) throw new Error('Player not found.');

    if (player.cardStack.length === 0) {
      throw new Error('No card to give.');
    }

    const givenRef = player.cardStack[player.cardStack.length - 1];
    const givenCard = this.getCardById(givenRef.cardId);

    const recipient = this.getRecipientForArrow(player.seatIndex, givenCard);
    const gift: PendingGift = {
      fromPlayerId: playerId,
      toPlayerId: recipient.id,
      cardId: givenCard.id,
      declaredItemName,
      source: 'drawn',
    };
    this.state.pendingGift = gift;
    setPhase(this.state, 'response_choice');
    return gift;
  }

  private getRecipientForArrow(giverSeatIndex: number, card: Card): PlayerState {
    const direction = card.arrowDirection;
    const total = this.players.length;
    let recipientIndex: number;
    if (direction === 'left') {
      recipientIndex = (giverSeatIndex - 1 + total) % total;
    } else {
      recipientIndex = (giverSeatIndex + 1) % total;
    }
    return this.players[recipientIndex]!;
  }

  handleGiftResponse(playerId: string, accept: boolean): void {
    assertPhase(this.state, 'response_choice');

    const gift = this.state.pendingGift;
    if (!gift) {
      throw new Error('No pending gift to respond to.');
    }
    if (gift.toPlayerId !== playerId) {
      throw new Error('Only the receiving player can respond.');
    }

    if (accept) {
      this.acceptGift(gift);
    } else {
      this.refuseGift(gift);
    }
  }

  private acceptGift(gift: PendingGift): void {
    const giver = this.state.playersById[gift.fromPlayerId];
    const receiver = this.state.playersById[gift.toPlayerId];
    if (!giver || !receiver) {
      throw new Error('Players not found.');
    }

    // Remove card from giver's stack (it must be the newest).
    giver.cardStack = giver.cardStack.filter((ref) => ref.cardId !== gift.cardId);
    receiver.cardStack.push({ cardId: gift.cardId });

    // Receiver must now give away their oldest card.
    if (receiver.cardStack.length === 0) {
      throw new Error('Receiver has no card to give.');
    }
    const oldestRef = receiver.cardStack[0];
    const oldestCard = this.getCardById(oldestRef.cardId);
    receiver.cardStack = receiver.cardStack.slice(1);

    const nextRecipient = this.getRecipientForArrow(receiver.seatIndex, oldestCard);

    this.state.pendingGift = {
      fromPlayerId: receiver.id,
      toPlayerId: nextRecipient.id,
      cardId: oldestCard.id,
      declaredItemName: oldestCard.itemName,
      source: 'oldest',
    };

    setPhase(this.state, 'response_choice');
  }

  private refuseGift(gift: PendingGift): void {
    const giver = this.state.playersById[gift.fromPlayerId];
    const receiver = this.state.playersById[gift.toPlayerId];
    if (!giver || !receiver) {
      throw new Error('Players not found.');
    }

    const card = this.getCardById(gift.cardId);
    const wasTruthful =
      gift.declaredItemName.trim().toLowerCase() ===
      card.itemName.trim().toLowerCase();

    const penalized = wasTruthful ? receiver : giver;
    penalized.penaltyCards.push(card.id);

    this.state.discardPile.push(card);
    giver.cardStack = giver.cardStack.filter((ref) => ref.cardId !== card.id);

    this.state.pendingGift = null;

    setPhase(this.state, 'penalty_resolution');

    this.resolvePenaltyDrawAndPass(penalized);
  }

  private resolvePenaltyDrawAndPass(penalized: PlayerState): void {
    const card = this.drawTopCard();
    if (!card) {
      throw new Error('No cards left to draw during penalty resolution.');
    }

    penalized.cardStack.push({ cardId: card.id });

    const recipient = this.getRecipientForArrow(penalized.seatIndex, card);

    this.state.pendingGift = {
      fromPlayerId: penalized.id,
      toPlayerId: recipient.id,
      cardId: card.id,
      declaredItemName: card.itemName,
      source: 'drawn',
    };

    setPhase(this.state, 'response_choice');
  }

  completeTurnIfNoPendingGift(): void {
    if (this.state.pendingGift) return;

    const someoneAtMaxPenalty = this.players.find(
      (p) => p.penaltyCards.length >= this.state.settings.maxPenalty,
    );
    if (someoneAtMaxPenalty) {
      setPhase(this.state, 'game_over');
      this.state.currentPlayerId = null;
      return;
    }

    advanceToNextPlayer(this.state);
    setPhase(this.state, 'draw_phase');
  }
}

