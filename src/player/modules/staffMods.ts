import { NotificationLevel, StaffMod } from '@minecraft-js/lunarbukkitapi';
import { config, player } from '../..';
import Item from '../../Classes/Item';
import PlayerModule from '../PlayerModule';

const settingItem = new Item(4);
settingItem.displayName = '§5§lLC §r§fStaff Mods §7(X-RAY)';
settingItem.lore = [
  '',
  '§7Enable §fStaff Mods §7For §5Lunar Client',
  '',
  `§7Current: §${config?.modules.staffMods ? 'aEnabled' : 'cDisabled'}`,
];

const playerModule = new PlayerModule(
  'LC Staff Mods',
  'Enable Staff Mods For Lunar Client',
  settingItem,
  'staffMods'
);

function enabledStaffMods() {
  player.lcPlayer?.sendNotification(
    'Enabled Staff Mods',
    1500,
    NotificationLevel.INFO
  );

  player.lcPlayer?.setStaffModState(StaffMod.XRAY, true);
  player.lcPlayer?.setStaffModState(StaffMod.NAME_TAGS, true);
  player.lcPlayer?.setStaffModState(StaffMod.BUNNY_HOP, true);
}
function disableStaffMods() {
  player.lcPlayer?.sendNotification(
    'Disabled Staff Mods',
    1500,
    NotificationLevel.INFO
  );

  player.lcPlayer?.setStaffModState(StaffMod.XRAY, false);
  player.lcPlayer?.setStaffModState(StaffMod.NAME_TAGS, false);
  player.lcPlayer?.setStaffModState(StaffMod.BUNNY_HOP, false);
}

playerModule.customCode = async () => {
  if (playerModule.enabled) enabledStaffMods();
  else disableStaffMods();
};

playerModule.onConfigChange = (enabled) => {
  if (enabled) enabledStaffMods();
  else disableStaffMods();
};

export default playerModule;
