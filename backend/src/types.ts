export type ArrowDirection = 'left' | 'right';

export interface Card {
  id: string;
  itemName: string;
  arrowDirection: ArrowDirection;
}

export type GamePhase =
  | 'lobby'
  | 'setup'
  | 'draw_phase'
  | 'declare_gift'
  | 'response_choice'
  | 'penalty_resolution'
  | 'round_end'
  | 'game_over';

export interface PlayerVisibleCardRef {
  cardId: string;
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  seatIndex: number;
  socketId: string | null;
  cardStack: PlayerVisibleCardRef[];
  penaltyCards: string[];
  totalScore: number;
  isConnected: boolean;
}

export interface PendingGift {
  fromPlayerId: string;
  toPlayerId: string;
  cardId: string;
  declaredItemName: string;
  source: 'drawn' | 'oldest';
}

export interface GameSettings {
  twoPlayerMode: boolean;
  multiRound: boolean;
  maxPenalty: number;
}

export interface GameState {
  phase: GamePhase;
  roundNumber: number;
  drawPile: Card[];
  discardPile: Card[];
  playersById: Record<string, PlayerState>;
  turnOrder: string[];
  currentPlayerId: string | null;
  pendingGift: PendingGift | null;
  settings: GameSettings;
}

