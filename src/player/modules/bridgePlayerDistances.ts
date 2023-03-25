import { config, player } from '../..';
import Item from '../../Classes/Item';
import PlayerModule from '../PlayerModule';

const settingItem = new Item(323);
settingItem.displayName = '§6Bridge §5Player §6Distance';
settingItem.lore = [
  '',
  "§7Shows you your opponent's and yourself's",
  '§7distances from the goals.',
  '',
  `§7Current: §${
    config.modules.bridgePlayerDistance ? 'aEnabled' : 'cDisabled'
  }`,
];

const playerModule = new PlayerModule(
  'BridgePlayerDistances',
  "Shows you your opponent's and yourself's distances from the goals.",
  settingItem,
  'bridgePlayerDistance'
);

setInterval(() => {
  if (
    !playerModule.enabled ||
    !player.connectedPlayers ||
    player.connectedPlayers.length > 1 ||
    !player.isInGameMode('DUELS_BRIDGE') ||
    !player.location?.x ||
    !player.connectedPlayers?.[0]?.location?.x
  )
    return;
  const meDist = Math.round(0 + player.location.x);
  const oppDist = Math.round(0 - player.connectedPlayers[0].location.x);
  player.client?.write('chat', {
    message: JSON.stringify({
      text:
        meDist == oppDist
          ? `§fYou and your opponent are §eequal §fdistances away from the goals`
          : meDist > oppDist
          ? `§fYou are §6${
              meDist - oppDist
            } §fblocks §aahead §fof your opponent`
          : `§fYou are §6${oppDist - meDist} blocks §cbehind §fyour opponent`,
    }),
    position: 2,
  });
}, 50);

export default playerModule;
