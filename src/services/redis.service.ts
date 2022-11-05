import {
  BindingKey,
  BindingScope,
  inject,
  injectable,
  LifeCycleObserver,
  lifeCycleObserver,
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

const trace = debugFactory('FileService:RedisService');

export const REDIS_SERVICE_CONFIG = BindingKey.create<RedisClientOptions>(
  'services.config.RedisService',
);
export const REDIS_SERVICE = BindingKey.create<RedisClient>(
  'services.RedisService',
);
export type RedisClient = RedisClientType<
  RedisModules,
  RedisFunctions,
  RedisScripts
>;

@injectable({scope: BindingScope.APPLICATION})
@lifeCycleObserver('services')
export class RedisService implements LifeCycleObserver {
  private _client: null | RedisClient;

  get client(): RedisClient {
    if (this._client === null) {
      throw new HttpErrors.InternalServerError('RedisClient is null');
    }
    return this._client;
  }

  async start() {
    try {
      await this.connect();
      trace('started');
    } catch (err) {
      console.error(err);
      throw new HttpErrors.InternalServerError('Redis Connection Failed');
    }
  }

  async stop() {
    try {
      await this.disconnect();
      trace('stopped');
    } catch (err) {
      console.error(err);
    }
  }

  async connect() {
    trace('Connecting to redis server');
    await this.client.connect();
  }

  async disconnect() {
    trace('Disconnecting from redis server');
    await this.client.disconnect();
  }

  constructor(
    @inject(REDIS_SERVICE_CONFIG) private configs: RedisClientOptions,
  ) {
    trace(this.configs);
    this._client = createClient(this.configs);
  }
}
