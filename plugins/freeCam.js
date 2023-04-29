const config = toolbox.getConfigSync();

const { Command, Item, PlayerModule } = toolbox;

const settingItem = new Item(420);
settingItem.displayName = '§cFREE §fCAM';
settingItem.lore = [
  '',
  '§7Allows you to see what is happening anywhere in',
  '§7your render distance without moving your player',
  '',
  `§7Current: §${config.modules.freeCam ? 'aEnabled' : 'cDisabled'}`,
];

const playerModule = new PlayerModule(
  'Free Cam',
  'Allows you to see what is happening anywhere in your render distance without moving your player',
  settingItem,
  'freeCam'
);

const command = new Command('freecam', [
  {
    argument: 'enabled',
    type: 'string',
    required: false,
  },
]);

let enabled = false;

command.onTriggered = (cmd, args) => {
  const oldEnabled = enabled;

  if (args[0] == 'true' || args[0] == 'false') enabled = JSON.parse(args[0]);
  else if (args[0] == 'on') enabled = true;
  else if (args[0] == 'off') enabled = false;
  else enabled = !enabled;

  if (enabled == oldEnabled) return;

  if (enabled) enable();
  else disable();
};

let realPosition;
let gamemode;
let hotbarMessage;

async function enable() {
  realPosition = {
    ...player.location,
    ...player.rawDirection,
    flags: 0,
  };
  player.client.write('position', {
    x: player.location.x,
    y: (player.location.y / 32 + 0.05) * 32,
    z: player.location.z,
    pitch: player.direction.pitch,
    yaw: player.direction.yaw,
    flags: 0,
  });
  player.client.write('abilities', {
    flags: 6,
    flyingSpeed: 0.05000000074505806,
    walkingSpeed: 0.10000000149011612,
  });

  player.client.write('player_info', {
    action: 0,
    data: [
      {
        UUID: player.client.uuid,
        name: player.client.username,
        properties: [],
        gamemode: 0,
        ping: 0,
      },
    ],
  });
  player.client.write('named_entity_spawn', {
    entityId: -100,
    playerUUID: player.client.uuid,
    x: player.location.x * 32,
    y: player.location.y * 32,
    z: player.location.z * 32,
    yaw: 0,
    pitch: player.rawDirection.pitch,
    currentItem: 345,
    metadata: [
      {
        type: 0,
        key: 3,
        value: 0,
      },
      {
        type: 0,
        key: 16,
        value: 0,
      },
      {
        type: 1,
        key: 1,
        value: 300,
      },
      {
        type: 0,
        key: 10,
        value: 127,
      },
      {
        type: 0,
        key: 8,
        value: 1,
      },
      {
        type: 3,
        key: 17,
        value: 0,
      },
      {
        type: 4,
        key: 2,
        value: '',
      },
      {
        type: 0,
        key: 4,
        value: 0,
      },
      {
        type: 2,
        key: 18,
        value: 0,
      },
      {
        type: 0,
        key: 9,
        value: 0,
      },
      {
        type: 3,
        key: 6,
        value: 20,
      },
      {
        type: 0,
        key: 0,
        value: 0,
      },
      {
        type: 2,
        key: 7,
        value: 8171462,
      },
    ],
  });

  player.client.write('game_state_change', {
    reason: 3,
    gameMode: 3,
  });
}

async function disable() {
  player.client.write('abilities', {
    flags: 0,
    flyingSpeed: 0.05000000074505806,
    walkingSpeed: 0.10000000149011612,
  });
  player.client.write('position', realPosition);
  if (hotbarMessage)
    player.client.write('chat', {
      position: 2,
      message: hotbarMessage,
    });

  player.client.write('entity_destroy', {
    entityIds: [-100],
  });
  player.client.write('player_info', {
    action: 4,
    data: [
      {
        UUID: player.client.uuid,
      },
    ],
  });

  player.client.write('game_state_change', {
    reason: 3,
    gameMode: gamemode,
  });
}

const fromServerStops = ['position', 'game_state_change'];
player.proxyHandler.on('fromServer', ({ name, data }) => {
  if (name === 'position') realPosition = data;
  if (name === 'game_state_change') gamemode = data.gameMode;
  if (name === 'chat' && data.position === 2) {
    hotbarMessage = data.message;
    setTimeout(() => {
      if (hotbarMessage === data.message) hotbarMessage = null;
    }, 2000);
    if (enabled) return false;
  }
  if (!enabled) return true;
  if (fromServerStops.includes(name)) return false;
});

const fromClientStops = [
  'position',
  'look',
  'position_look',
  'flying',
  'abilities',
  'arm_animation',
  'window_click',
];
player.proxyHandler.on('fromClient', ({ name, data }) => {
  if (!enabled) return true;
  if (fromClientStops.includes(name)) return false;
});

player.listener.on('switch_server', () => {
  if (enabled) {
    enabled = false;
    disable();
  }
});

setInterval(() => {
  if (enabled)
    player.client.write('chat', {
      position: 2,
      message: '{"text": "§cIn FreeCam"}',
    });
}, 500);

registerCommand(command);

registerPlayerModule(playerModule);

registerPlugin({
  name: 'FreeCam',
  description:
    'Allows you to see what is happening anywhere in your render distance without moving your player',
  version: '1.0.0',
  author: 'TBHGodPro',
});
