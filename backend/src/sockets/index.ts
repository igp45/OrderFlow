import { Server } from 'socket.io';

export function initSockets(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('disconnect', (_reason: string) => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
