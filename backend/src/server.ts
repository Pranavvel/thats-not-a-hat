import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { z } from 'zod';
import { RoomManager } from './rooms/RoomManager';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const roomManager = new RoomManager();

const CreateRoomSchema = z.object({
  playerId: z.string(),
  name: z.string(),
  avatar: z.string(),
  isPublic: z.boolean().optional().default(true),
});

const JoinRoomSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
  name: z.string(),
  avatar: z.string(),
});

const StartGameSchema = z.object({
  roomId: z.string(),
  settings: z
    .object({
      twoPlayerMode: z.boolean().optional(),
      multiRound: z.boolean().optional(),
      maxPenalty: z.number().int().positive().optional(),
    })
    .optional(),
});

const DrawCardSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
});

const DeclareGiftSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
  declaredItemName: z.string(),
});

const RespondToGiftSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
  accept: z.boolean(),
});

io.on('connection', (socket) => {
  socket.on('request_state_sync', (roomId: string, cb?: (payload: unknown) => void) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      cb?.({ ok: false, error: 'Room not found.' });
      return;
    }
    cb?.({ ok: true, state: room.getState(), players: room.getPlayers() });
  });

  socket.on('create_room', (raw, cb) => {
    try {
      const payload = CreateRoomSchema.parse(raw);
      const room = roomManager.createRoom(payload.playerId, payload.isPublic);
      const gameRoom = room;
      const player = gameRoom.addPlayer(payload.playerId, payload.name, payload.avatar);
      socket.join(room.id);
      player.socketId = socket.id;
      cb?.({ ok: true, roomId: room.id, playerId: player.id });
      io.to(room.id).emit('room_update', {
        roomId: room.id,
        players: gameRoom.getPlayers(),
        state: gameRoom.getState(),
      });
    } catch (err) {
      cb?.({ ok: false, error: (err as Error).message });
    }
  });

  socket.on('join_room', (raw, cb) => {
    try {
      const payload = JoinRoomSchema.parse(raw);
      const room = roomManager.getRoom(payload.roomId);
      if (!room) throw new Error('Room not found.');
      const player = room.addPlayer(payload.playerId, payload.name, payload.avatar);
      player.socketId = socket.id;
      socket.join(room.id);
      cb?.({ ok: true, roomId: room.id, playerId: player.id });
      io.to(room.id).emit('room_update', {
        roomId: room.id,
        players: room.getPlayers(),
        state: room.getState(),
      });
    } catch (err) {
      cb?.({ ok: false, error: (err as Error).message });
    }
  });

  socket.on('start_game', (raw, cb) => {
    try {
      const payload = StartGameSchema.parse(raw);
      const room = roomManager.getRoom(payload.roomId);
      if (!room) throw new Error('Room not found.');
      room.startGame(payload.settings);
      io.to(room.id).emit('game_state', room.getState());
      cb?.({ ok: true });
    } catch (err) {
      cb?.({ ok: false, error: (err as Error).message });
    }
  });

  socket.on('draw_card', (raw, cb) => {
    try {
      const payload = DrawCardSchema.parse(raw);
      const room = roomManager.getRoom(payload.roomId);
      if (!room) throw new Error('Room not found.');
      const result = room.handleDraw(payload.playerId);
      io.to(room.id).emit('drawn_card', {
        playerId: payload.playerId,
        drawnCard: result.drawnCard,
        state: room.getState(),
      });
      cb?.({ ok: true });
    } catch (err) {
      cb?.({ ok: false, error: (err as Error).message });
    }
  });

  socket.on('declare_gift', (raw, cb) => {
    try {
      const payload = DeclareGiftSchema.parse(raw);
      const room = roomManager.getRoom(payload.roomId);
      if (!room) throw new Error('Room not found.');
      const gift = room.handleGiftDeclaration(
        payload.playerId,
        payload.declaredItemName,
      );
      io.to(room.id).emit('gift_declared', {
        gift,
        state: room.getState(),
      });
      cb?.({ ok: true });
    } catch (err) {
      cb?.({ ok: false, error: (err as Error).message });
    }
  });

  socket.on('respond_to_gift', (raw, cb) => {
    try {
      const payload = RespondToGiftSchema.parse(raw);
      const room = roomManager.getRoom(payload.roomId);
      if (!room) throw new Error('Room not found.');
      room.handleGiftResponse(payload.playerId, payload.accept);
      room.completeTurnIfNoPendingGift();
      io.to(room.id).emit('game_state', room.getState());
      cb?.({ ok: true });
    } catch (err) {
      cb?.({ ok: false, error: (err as Error).message });
    }
  });

  socket.on('disconnect', () => {
    // For now, rooms remain in memory until process restart.
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT ?? 4000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Game server listening on port ${PORT}`);
});

