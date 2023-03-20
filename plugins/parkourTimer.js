const { Command } = toolbox;

const cmd = new Command(
  'reset', // Command name
  [], // Command syntax
  ['pr'] // Command aliases
);

let timeStarted = null;
let timeStartedCheckpoint = null;
let checkpoint = null;

cmd.onTriggered = () => {
  player.executeCommand('/parkour reset');
  timeStarted = null;
};

registerCommand(cmd);

player.proxyHandler.on('fromServer', (data, meta) => {
  if (meta.name != 'chat' || data.position != 0) return;
  let { message } = data;
  message = JSON.parse(message);
  message.extra ??= [];
  message = [message.text, ...message.extra.map((i) => i.text)].join('');
  if (
    message.includes('Parkour challenge started!') ||
    message.includes('Reset your timer to 00:00!')
  ) {
    timeStarted = Date.now();
    timeStartedCheckpoint = timeStarted;
    checkpoint = 1;
  }
  if (
    message.includes('cancelled') ||
    message.includes('failed') ||
    message.includes('completed') ||
    message.includes('record')
  ) {
    timeStarted = null;
    timeStartedCheckpoint = null;
    checkpoint = null;
  }
  if (
    message.match(
      /You reached Checkpoint #[0-9]+ after [0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]./
    )
  ) {
    timeStartedCheckpoint = Date.now();
    const res = message.match(/Checkpoint #[0-9]+/);
    checkpoint = parseInt(res[0].substring(res.index)) + 1;
  }
});

function parseTime(ms) {
  let minutes = Math.floor(ms / 60000).toString();
  ms = ms - minutes * 60000;
  let seconds = Math.floor(ms / 1000).toString();
  ms = (ms - seconds * 1000).toString();

  while (minutes.length < 2) minutes = '0' + minutes;
  while (seconds.length < 2) seconds = '0' + seconds;
  while (ms.length < 3) ms = '0' + ms;

  return `§a${minutes}§f:§a${seconds}§f.§a${ms}`;
}

setInterval(() => {
  if (timeStarted) {
    const time = Date.now() - timeStarted;
    const checkpointTime = Date.now() - timeStartedCheckpoint;

    player.client?.write('chat', {
      message: JSON.stringify({
        text: `§2Total§f: ${parseTime(
          time
        )} §f| §2Checkpoint #${checkpoint}§f: ${parseTime(checkpointTime)}`,
      }),
      position: 2,
    });
  }
}, 50);

player.listener.on('switch_server', () => (timeStarted = null));

registerPlugin({
  name: 'Parkour Timer',
  description: 'Live Timer For Parkour | `/pr` `/reset`',
  version: '1.2.0',
  author: 'TBHGodPro',
});
