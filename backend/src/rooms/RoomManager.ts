import { randomUUID } from 'crypto';
import { GameRoom } from '../game/GameRoom';

export class RoomManager {
  private readonly rooms = new Map<string, GameRoom>();

  createRoom(hostPlayerId: string, isPublic: boolean): GameRoom {
    const id = randomUUID();
    const room = new GameRoom({ id, hostPlayerId, isPublic });
    this.rooms.set(id, room);
    return room;
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  destroyRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  listRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }
}

