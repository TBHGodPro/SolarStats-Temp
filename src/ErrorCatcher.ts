import { dashboard, player, toClient } from '.';
import Logger from './Classes/Logger';

process.on('uncaughtException', (err) => {
  const msg = err.message;

  // Invalid API Key
  if (msg.includes('[hypixel-api-reborn] Invalid API Key!')) {
    Logger.error(
      'Invalid API Key! Make sure to put a valid API Key in the config.json file'
    );
    process.exit(1);
  }

  // RateLimited
  if (msg.includes('RateLimiter disallowed request')) {
    Logger.error('You were RateLimited!');
    toClient?.end(
      '§fYou have been §cRateLimited§f, please try again in a moment.'
    );
    dashboard.emit('notification', {
      title: 'RateLimited',
      message: 'You were RateLimited!',
      type: 'fail',
      duration: 3000,
    });
    player.proxyHandler.emit('end', toClient.username, false);
    return;
  }

  throw err;
});
