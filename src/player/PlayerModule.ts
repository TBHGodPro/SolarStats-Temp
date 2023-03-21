import { Status } from 'hypixel-api-reborn';
import Item from '../Classes/Item';
import { getConfig, setValueSync } from '../utils/config';
import { PluginInfo } from '../utils/plugins';
import Player from './Player';

enum Events {
  CustomCode = 'customCode',
  ConfigChange = 'onConfigChange',
  LocationUpdate = 'onLocationUpdate',
  Disconnect = 'onDisconnect',
}

export default class PlayerModule {
  public readonly name: string;
  public readonly description: string;
  public player: Player;
  public enabled: boolean;

  public onConfigChange: (enabled: boolean) => void;
  public onLocationUpdate: (status: Status) => void;
  public onDisconnect: () => void;

  public settingItem: Item;
  public configKey: string;

  public createdBy?: PluginInfo;

  public constructor(
    name: string,
    description: string,
    settingItem: Item,
    configKey: string
  ) {
    this.name = name;
    this.description = description;

    if (configKey) {
      const config = getConfig();
      this.enabled = config.modules[configKey];
      if (this.enabled === undefined) {
        const newConfig = { ...config.modules };
        newConfig[configKey] = false;
        setValueSync('modules', newConfig);
        this.toggleEnabled(false);
      }
    } else this.enabled = true;

    this.onConfigChange = () => {};
    this.onLocationUpdate = () => {};
    this.onDisconnect = () => {};

    this.settingItem = settingItem;
    this.configKey = configKey;
  }

  public setPlayer(player: Player): PlayerModule {
    this.player = player;
    return this;
  }

  public toggleEnabled(value?: boolean) {
    this.enabled = value != undefined ? value : !this.enabled;
  }

  public handle(
    type: keyof typeof Events,
    func: (...args: any) => void
  ): PlayerModule {
    this[Events[type]] = func;
    return this;
  }
}
