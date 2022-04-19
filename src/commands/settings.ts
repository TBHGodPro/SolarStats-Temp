import { config, reloadConfig } from '..';
import Command from '../Classes/Command';
import Inventory from '../Classes/Inventory';
import Item from '../Classes/Item';
import Logger from '../Classes/Logger';
import { InventoryType, WindowClickEvent } from '../Types';
import { setValue } from '../utils/config';

const command = new Command(
  'solarstats',
  [
    {
      argument: 'action',
      required: false,
      type: 'string',
    },
  ],
  ['ss', 'solartweaks']
);

command.onTriggered = async (chatCommand, args) => {
  const player = command.player;

  const action = command.getStringArgument(args, 0, true);
  if (action === 'reload') {
    await reloadConfig();
    player.sendMessage('§aSolar Stats config successfully reloaded!');
    return;
  }

  const inventory = new Inventory(
    InventoryType.CONTAINER,
    '§cSettings §8- §cSolar Stats',
    45
  );

  const nametag = new Item(421);
  nametag.displayName = '§fAPI Key';
  nametag.lore = [
    '',
    '§7The API key is used to retrieve',
    '§7data from the Hypixel API',
    '',
    `§7Current: §o${config.apiKey ?? '§rnone'}`,
  ];

  const commandBlock = new Item(137);
  commandBlock.displayName = '§fServer actions';
  commandBlock.lore = [
    '',
    '§7Manage Solar Stats',
    '§7proxy server from here',
    '',
    '§7§nActions:',
    '§7§lRight Click §r§7- Stop server',
    '§7§lLeft Click §r§7- Restart server',
  ];

  const barrier = new Item(166);
  barrier.displayName = '§cClose';

  const paper = new Item(339);
  paper.displayName = '§fStatus';
  paper.lore = [
    '',
    `§7Player: §a${player.client.username}`,
    `§7Uptime: ${Math.floor(process.uptime())}s`,
  ];

  inventory.addItems([
    { item: nametag, position: 0 },
    { item: commandBlock, position: 36 },
    { item: barrier, position: 40 },
    { item: paper, position: 44 },
  ]);

  const settingsMutator: {
    [key: number]: (event: WindowClickEvent) => void;
  } = {};

  for (const module of command.player.modules) {
    const slot = Object.keys(inventory.items).length - 3;
    inventory.addItem(module.settingItem, slot);
    settingsMutator[slot] = async (event) => {
      event.cancel(player.client);
      await setValue(module.configKey, !config[module.configKey]);
      await reloadConfig();
      module.settingItem.lore[4] = `§7Current: §${
        config[module.configKey] ? 'aEnabled' : 'cDisabled'
      }`;
      inventory.setSlot(player.client, module.settingItem, slot);
    };
  }

  inventory.on('click', async (event) => {
    if (event.button !== 0 || event.mode !== 0) {
      event.cancel(player.client);
      return;
    }

    switch (event.slot) {
      case 0:
      case 12:
      case 44:
        event.cancel(player.client);
        break;
      case 40:
        inventory.close(player);
        break;
      default:
        // Other slot, handling here
        if (settingsMutator[event.slot]) settingsMutator[event.slot](event);

        break;
    }
  });

  inventory.display(player);
};

export default command;
