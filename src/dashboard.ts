import { createServer } from 'node:https';
import { WebSocketServer, WebSocket } from 'ws';
import Logger from './Classes/Logger';

const logger = new Logger('dashboard');

export default async function () {
  const server = createServer();
  const wss = new WebSocketServer({
    server,
  });

  const dashboard = new DashboardManager(wss);

  return dashboard;
}

// TODO: Make protocol
export class DashboardManager {
  public server: WebSocketServer;
  public connections: WebSocket[] = [];

  constructor(server: WebSocketServer) {
    this.server = server;

    this.server.on('error', (err) => logger.error('[Server Error]', err));

    this.server.on('connection', (socket) => this.initSocket(socket));
  }

  public initSocket(socket: WebSocket) {
    // TODO: Send metadata

    this.connections.push(socket);
    socket.on('error', (err) => logger.error('[WebSocket Error]', err));
    socket.on('close', () =>
      this.connections.splice(this.connections.indexOf(socket), 1)
    );
  }

  public emit<T extends keyof DashboardEvents>(
    event: T,
    data: DashboardEvents[T]
  ) {}
}

export type DashboardEvents = {
  updateConfig: {
    modules: {};
  };
  updatePlayers: [];
};
