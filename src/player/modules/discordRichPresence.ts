import { Client } from 'discord-rpc';
import { config, player } from '../..';
import Item from '../../Classes/Item';
import Logger from '../../Classes/Logger';
import PlayerModule from '../PlayerModule';

const logger = new Logger('Discord RPC');

const settingItem = new Item(61);
settingItem.displayName = '§5Discord §6Rich Presence';
settingItem.lore = [
  '',
  '§7Enable or Disable Discord Rich Presence for SolarStats',
  '',
  `§7Current: §${
    config?.modules.discordRichPresence ? 'aEnabled' : 'cDisabled'
  }`,
];

const playerModule = new PlayerModule(
  'DiscordRichPresence',
  'Use Discord Rich Presence for SolarStats',
  settingItem,
  'discordRichPresence'
);

export const clientId = '1084125392555745360';
export const discordClient = new Client({ transport: 'ipc' });

let activity = playerModule.enabled ? {} : null;
export async function updateActivity() {
  if (!activity) return;

  const info = {
    state:
      player?.online && player?.status
        ? [
            player.status?.game?.name,
            player.status?.mode
              ? player.status.mode
                  .split('_')
                  .map((i) => i[0].toUpperCase() + i.substring(1).toLowerCase())
                  .join(' ')
              : null,
            player.status?.map,
          ]
            .filter((i) => i)
            .join(' • ')
        : 'Running SolarStats',
    ...(player?.online && player?.status
      ? {
          details: `Connected to ${config.server.host}${
            config.server.port == 25565 ? '' : `:${config.server.port}`
          }`,
        }
      : {}),
    largeImageKey: 'logo',
  };

  if (JSON.stringify(activity) == JSON.stringify(info)) return;
  activity = info;

  await discordClient.setActivity(info).catch((error) => logger.error(error));
}

export function enableActivity() {
  activity = {};
  updateActivity();
}
export function disableActivity() {
  discordClient.clearActivity();
  activity = null;
}

discordClient.login({ clientId }).then((client) => {
  if (client) {
    logger.info(`Authed for user ${client.user.username}`);
    if (playerModule.enabled) enableActivity();
    else disableActivity();
  } else logger.error('Failed to login to Discord RPC');
});

playerModule.onConfigChange = async (enabled) => {
  if (enabled) enableActivity();
  else disableActivity();
};

export default playerModule;
