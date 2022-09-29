import {BindingKey} from '@loopback/core';
import {RedisClientOptions} from 'redis';
import {Redis} from './services';

export namespace FILE_SERVICE_KEYS {
  export const REDIS_SERVICE_CONFIG = BindingKey.create<RedisClientOptions>(
    'services.config.Redis',
  );
  export const REDIS_SERVICE = BindingKey.create<Redis>('services.Redis');
}
