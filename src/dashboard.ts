import { exec } from 'node:child_process';
import { createServer, IncomingMessage } from 'node:http';
import { join } from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import Logger from './Classes/Logger';
import { Config } from './Types';
import { getConfigAsync } from './utils/config';
import { getPlugins } from './utils/plugins';

const logger = new Logger('Dashboard');

const httpServer = createServer();

export default function () {
  const wss = new WebSocketServer({
    server: httpServer,
  });

  const dashboard = new DashboardManager(wss);

  return dashboard;
}

// TODO: Make protocol
export class DashboardManager {
  public server: WebSocketServer;

  public socket: WebSocket = null;

  constructor(server: WebSocketServer) {
    this.server = server;

    this.server.on('error', (err) => logger.error('[Server Error]', err));

    this.server.on('connection', (socket, request) =>
      this.initSocket(socket, request)
    );

    (async () => {
      const config = await getConfigAsync();

      if (isNaN(config.dashboard.port)) return logger.error('Invalid Port');

      this.server.on('listening', () =>
        logger.info(
          `Dashboard WebSocket Online at port ${config.dashboard.port}`
        )
      );

      httpServer.listen(config.dashboard.port);

      if (config.dashboard.enabled)
        exec(
          `export SOLARSTATS_PORT=${config.dashboard.port};npx electron "${join(
            process.cwd(),
            'dashboard/dist/bundled'
          )}"`,
          (err, out) => {
            if (err) logger.error('[Dashboard Error]', err);
          }
        );
    })();
  }

  public async initSocket(socket: WebSocket, request: IncomingMessage) {
    if (this.socket) return socket.close(4000);
    this.socket = socket;

    this.socket.on('error', (err) => logger.error('[WebSocket Error]', err));
    this.socket.on('close', () => (this.socket = null));

    this.emit('metadata', {
      startedAt: Date.now() - Math.floor(process.uptime() * 1000),
      config: await getConfigAsync(),
      plugins: (await getPlugins()).map((p) => p.replace(/\.js/g, '')),
    });
  }

  public emit<T extends keyof DashboardEvents>(
    op: T,
    data: DashboardEvents[T]
  ): Promise<void> {
    return new Promise((res, rej) => {
      this.socket?.send(
        JSON.stringify({
          op,
          data,
        }),
        (err) => (err ? rej(err) : res())
      );
    });
  }
}

export type DashboardEvents = {
  metadata: {
    startedAt: number;
    config: Config;
    plugins: string[];
  };
  focus: null;
};
