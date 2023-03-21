import { player } from '..';

export default class BossBar {
  public ID: number;
  public text: string;
  public health: number;
  public spawned: boolean;

  constructor(text: string, health: number) {
    this.spawned = false;

    this.generateID();

    if (typeof text !== 'string')
      throw new Error('BossBar Text must be a string');
    this.text = text;

    if (isNaN(health)) throw new Error('BossBar Health must be a number');
    health = Number(health);
    if (health < 0 || health > 1000)
      throw new Error('BossBar Health must be between 0 and 1000');
    this.health = health;
  }

  private generateID() {
    const oldID = this.ID;
    while (!this.ID || this.ID === -1234 || this.ID === oldID)
      this.ID = Number(`-${Math.floor(Math.random() * 500) + 1250}`);
  }

  public spawn() {
    if (this.spawned) this.despawn();
    this.generateID();
    this.spawned = true;
    player.client.write('spawn_entity_living', {
      entityId: this.ID,
      type: 64,
      x: -624,
      y: 3104,
      z: 16,
      yaw: 0,
      pitch: 0,
      headPitch: 0,
      velocityX: 0,
      velocityY: 0,
      velocityZ: 0,
      metadata: [
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
      ],
    });
  }

  public despawn() {
    if (!this.spawned) return;
    this.spawned = false;
    console.log('Despawned');
    player.client.write('entity_destroy', {
      entityIds: [this.ID],
    });
  }

  public setText(text: string) {
    if (typeof text !== 'string')
      throw new Error('BossBar Text must be a string');

    this.text = text;

    if (this.spawned) this.spawn();
  }

  public setHealth(health: number) {
    if (isNaN(health)) throw new Error('BossBar Health must be a number');
    health = Number(health);
    if (health < 0 || health > 1000)
      throw new Error('BossBar Health must be between 0 and 1000');

    this.health = health;

    if (this.spawned) this.spawn();
  }
}
