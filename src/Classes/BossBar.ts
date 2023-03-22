import { player } from '..';
import { Location } from '../Types';

export default class BossBar {
  public ID = -1234;
  public text: string;
  public health: number;
  public spawned: boolean;

  public realBossBar: any = null;

  public location: Location = {
    x: -624,
    y: 3104,
    z: 16,
  };

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
        value: this.health,
      },
      {
        type: 2,
        key: 19,
        value: 0,
      },
      {
        type: 2,
        key: 20,
        value: 1000,
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

    if (typeof text !== 'string')
      throw new Error('BossBar Text must be a string');
    this.text = text;

    if (isNaN(health)) throw new Error('BossBar Health must be a number');
    health = Number(health);
    if (health < 0 || health > 300)
      throw new Error('BossBar Health must be between 0 and 300');
    this.health = health;

    player.listener.on('switch_server', () => {
      this.location = {
        x: -624,
        y: 3104,
        z: 16,
      };
      this.spawnWithVerify();
    });

    player.proxyHandler.on('fromServer', (data, meta) => {
      if (
        meta.name === 'spawn_entity_living' &&
        data.type === 64 &&
        data.metadata?.find(
          (m) => m.type === 4 && m.key === 2 && typeof m.value === 'string'
        ) &&
        data.metadata.find(
          (m) => m.type === 3 && m.key === 6 && typeof m.value === 'number'
        )
      ) {
        this.location = {
          x: data.x,
          y: data.y,
          z: data.z,
        };
        this.realBossBar = data;
        return !this.spawned;
      } else if (
        meta.name === 'entity_metadata' &&
        this.realBossBar &&
        data.entityId === this.realBossBar.entityId
      ) {
        this.realBossBar.metadata = data.metadata;
        return !this.spawned;
      } else if (
        meta.name === 'entity_destroy' &&
        this.realBossBar &&
        data.entityIds.includes(this.realBossBar.entityId)
      ) {
        this.realBossBar = null;
        return !this.spawned;
      } else if (
        meta.name === 'entity_teleport' &&
        this.realBossBar &&
        data.entityId === this.realBossBar.entityId
      ) {
        this.location = {
          x: data.x,
          y: data.y,
          z: data.z,
        };
      }
    });
  }

  private spawnWithVerify() {
    if (this.spawned) this.spawn(true);
    setTimeout(() => {
      if (this.spawned) this.spawn(true);
    }, 250);
    setTimeout(() => {
      if (this.spawned) this.spawn(true);
    }, 500);
    setTimeout(() => {
      if (this.spawned) this.spawn(true);
    }, 750);
    setTimeout(() => {
      if (this.spawned) this.spawn(true);
    }, 1000);
  }

  public render(skipSpawnedCheck = false) {
    if (!skipSpawnedCheck && !this.spawned) this.spawn();

    player.client?.write('entity_metadata', {
      entityId: this.ID,
      metadata: this.metadata,
    });
  }

  public spawn(skipSpawnedCheck = false) {
    if (!skipSpawnedCheck && this.spawned) this.render();
    this.spawned = true;

    if (this.realBossBar)
      player.client?.write('entity_destroy', {
        entityIds: [this.realBossBar.entityId],
      });

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

  public despawn(skipSpawnedCheck = false) {
    if (!skipSpawnedCheck && !this.spawned) return;
    this.spawned = false;

    player.client?.write('entity_destroy', {
      entityIds: [this.ID],
    });

    if (this.realBossBar)
      player.client?.write('spawn_entity_living', this.realBossBar);
  }

  public setText(text: string) {
    if (typeof text !== 'string')
      throw new Error('BossBar Text must be a string');

    this.text = text;

    if (this.spawned) this.render();
  }

  public setHealth(health: number) {
    if (isNaN(health)) throw new Error('BossBar Health must be a number');
    health = Number(health);
    if (health < 0 || health > 300)
      throw new Error('BossBar Health must be between 0 and 300');

    this.health = health;

    if (this.spawned) this.render();
  }
}
