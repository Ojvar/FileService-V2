import {
  BindingScope,
  config,
  injectable,
  LifeCycleObserver,
  lifeCycleObserver,
  Provider,
} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import debugFactory from 'debug';
import {
  createClient,
  RedisClientOptions,
  RedisClientType,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from 'redis';
import {FILE_SERVICE_KEYS} from '../keys';

const trace = debugFactory('FileService:RedisService');
export type Redis = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

@injectable({scope: BindingScope.SINGLETON})
@lifeCycleObserver('services')
export class RedisProvider implements Provider<Redis>, LifeCycleObserver {
  private _client: null | Redis;
  private get client(): Redis {
    if (this._client === null) {
      throw new HttpErrors.InternalServerError('RedisClient is null');
    }
    return this._client;
  }

  start() {
    trace('started');
    this.connect().catch(console.error);
  }

  stop() {
    trace('stopped');
    this.disconnect().catch(console.error);
  }

  async connect() {
    trace('Connecting to redis server');
    await this.client.connect();
  }

  async disconnect() {
    trace('Disconnecting from redis server');
    await this.client.disconnect();
  }

  value(): Redis {
    return this.client;
  }

  constructor(
    @config(FILE_SERVICE_KEYS.REDIS_SERVICE_CONFIG, {optional: true})
    private configs: RedisClientOptions = {},
  ) {
    trace(this.configs);
    this._client = createClient(this.configs);
  }
}
