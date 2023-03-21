import { player } from '..';

export class BossBar {
  public ID: number;
  public text: string;
  public health: number;
  public spawned: boolean;

  public realBossBar: any = null;

  public get location(): {
    x: number;
    y: number;
    z: number;
  } {
    // TODO: Proper location getting using packet tracking and research on how hypixel deals with relative locations for this
    return { x: -624, y: 3104, z: 16 };
  }
  public get metadata(): (
    | {
        type: number;
        key: number;
        value: number;
      }
    | {
        type: 4;
        key: 2;
        value: string;
      }
  )[] {
    return [
      {
        type: 0,
        key: 3,
        value: 1,
      },
      {
        type: 0,
        key: 0,
        value: 32,
      },
      {
        type: 3,
        key: 6,
        value: 300,
      },
      {
        type: 2,
        key: 19,
        value: 0,
      },
      {
        type: 2,
        key: 20,
        value: this.health,
      },
      {
        type: 4,
        key: 2,
        value: this.text,
      },
      {
        type: 2,
        key: 17,
        value: 0,
      },
      {
        type: 2,
        key: 18,
        value: 0,
      },
    ];
  }

  constructor(text: string, health: number) {
    this.spawned = false;

    this.generateID();

    if (typeof text !== 'string') throw new Error('BossBar Text must be a string');
    this.text = text;

    if (isNaN(health)) throw new Error('BossBar Health must be a number');
    health = Number(health);
    if (health < 0 || health > 1000) throw new Error('BossBar Health must be between 0 and 1000');
    this.health = health;

    player.listener.on('switch_server', () => {
      if (this.spawned) this.spawn();
    });

    player.proxyHandler.on('fromServer', (data, meta) => {
      if (meta.name === 'spawn_entity_living' && data.type === 64 && data.metadata?.find(m => m.type === 4 && m.key === 2 && typeof m.value === 'string') && data.metadata.find(m => m.type === 2 && m.key === 20 && typeof m.value === 'number')) this.realBossBar = data;
      else if (meta.name === 'entity_metadata' && this.realBossBar && data.entityId === this.realBossBar.entityId) this.realBossBar.metadata = data.metadata;
      else if (meta.name === 'entity_destroy' && this.realBossBar && data.entityIds.includes(this.realBossBar.entityId)) this.realBossBar = null;
      return !this.spawned;
    });

    setInterval(() => this.updateLocation(), 2000);
  }

  private generateID() {
    const oldID = this.ID;
    // Randomly set ID between 1250 and 1750, anything that is not the same as the old ID and is not an ID used by hypixel
    while (!this.ID || this.ID === this.realBossBar?.entityId || this.ID === -1234 || this.ID === oldID) this.ID = Number(`-${Math.floor(Math.random() * 500) + 1250}`);
  }

  public updateLocation() {
    if (!this.spawned) return;
    player.client?.write('entity_teleport', {
      entityId: this.ID,
      ...this.location,
      yaw: 0,
      pitch: 0,
      onGround: false,
    });
  }

  public render() {
    if (this.spawned) {
      this.updateLocation();
      player.client?.write('entity_metadata', {
        entityId: this.ID,
        metadata: this.metadata,
      });
    } else this.spawn();
  }

  public spawn() {
    if (this.spawned) this.despawn();
    this.generateID();
    this.spawned = true;

    if (this.realBossBar) {
      player.client?.write('entity_destroy', {
        entityIds: [this.realBossBar.entityId],
      });
      this.realBossBar = null;
    }

    player.client?.write('spawn_entity_living', {
      entityId: this.ID,
      type: 64,
      ...this.location,
      yaw: 0,
      pitch: 0,
      headPitch: 0,
      velocityX: 0,
      velocityY: 0,
      velocityZ: 0,
      metadata: this.metadata,
    });
  }

  public despawn() {
    if (!this.spawned) return;
    this.spawned = false;

    player.client?.write('entity_destroy', {
      entityIds: [this.ID],
    });

    if (this.realBossBar) player.client?.write('spawn_entity_living', this.realBossBar);
  }

  public setText(text: string) {
    if (typeof text !== 'string') throw new Error('BossBar Text must be a string');

    this.text = text;

    if (this.spawned) this.render();
  }

  public setHealth(health: number) {
    if (isNaN(health)) throw new Error('BossBar Health must be a number');
    health = Number(health);
    if (health < 0 || health > 1000) throw new Error('BossBar Health must be between 0 and 1000');

    this.health = health;

    if (this.spawned) this.render();
  }
}

export default new BossBar(`§cSolar§fStats`, 1000).render();
