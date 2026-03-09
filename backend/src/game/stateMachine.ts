import type { GamePhase, GameState } from '../types';

export function assertPhase(state: GameState, expected: GamePhase): void {
  if (state.phase !== expected) {
    throw new Error(`Invalid phase: expected ${expected}, got ${state.phase}`);
  }
}

export function ensureCurrentPlayer(state: GameState, playerId: string): void {
  if (state.currentPlayerId !== playerId) {
    throw new Error('It is not this player’s turn.');
  }
}

export function advanceToNextPlayer(state: GameState): void {
  const { turnOrder, currentPlayerId } = state;
  if (!currentPlayerId || turnOrder.length === 0) {
    state.currentPlayerId = null;
    return;
  }
  const idx = turnOrder.indexOf(currentPlayerId);
  const nextIdx = idx === -1 ? 0 : (idx + 1) % turnOrder.length;
  state.currentPlayerId = turnOrder[nextIdx] ?? null;
}

export function setPhase(state: GameState, phase: GamePhase): void {
  state.phase = phase;
}

