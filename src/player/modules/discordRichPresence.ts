import { Client } from 'discord-rpc';
import { config, player } from '../..';
import Item from '../../Classes/Item';
import Logger from '../../Classes/Logger';
import PlayerModule from '../PlayerModule';

const logger = new Logger('Discord RPC');

const settingItem = new Item(61);
settingItem.displayName = '§5Discord §6Rich Presence';
settingItem.lore = ['', '§7Enable or Disable Discord Rich Presence for SolarStats', '', `§7Current: §${config?.modules.discordRichPresence ? 'aEnabled' : 'cDisabled'}`];

const playerModule = new PlayerModule('Discord Rich Presence', 'Use Discord Rich Presence for SolarStats', settingItem, 'discordRichPresence');

export const clientId = '1084125392555745360';
export const discordClient = new Client({ transport: 'ipc' });

let activity = playerModule.enabled ? {} : null;
export async function updateActivity() {
  if (!activity) return;

  const info = {
    state: player.statusMessage !== 'Offline' ? player.statusMessage : 'Running SolarStats',
    ...(player.statusMessage !== 'Offline'
      ? {
          details: `Connected to ${config.server.host}${config.server.port == 25565 ? '' : `:${config.server.port}`}`,
        }
      : {}),
    largeImageKey: 'logo',
  };

  if (JSON.stringify(activity) == JSON.stringify(info)) return;
  activity = info;

  await discordClient.setActivity(info).catch(err => logger.error(err));
}

export async function enableActivity() {
  activity = {};
  await updateActivity();
}
export async function disableActivity() {
  await discordClient.clearActivity().catch(err => logger.error(err));
  activity = null;
}

export async function login() {
  try {
    const c = await discordClient.login({ clientId });

    if (c) {
      logger.info(`Authed for user ${c.user.username}`);
      if (playerModule.enabled) enableActivity();
      else disableActivity();
    } else logger.error('Failed to login to Discord RPC');
  } catch (err) {
    logger.error('Failed to login to Discord RPC', err);
  }
}

login();

playerModule.onConfigChange = async enabled => {
  if (enabled) enableActivity();
  else disableActivity();
};

export default playerModule;
