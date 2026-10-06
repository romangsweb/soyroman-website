import * as migration_20261006_183643_initial from './20261006_183643_initial';

export const migrations = [
  {
    up: migration_20261006_183643_initial.up,
    down: migration_20261006_183643_initial.down,
    name: '20261006_183643_initial'
  },
];
