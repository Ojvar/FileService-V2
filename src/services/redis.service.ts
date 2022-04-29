import {/* inject, */ BindingScope, config, injectable} from '@loopback/core';
import {RedisClientType} from '@node-redis/client';
import debugFactory from 'debug';
import {createClient, RedisClientOptions} from 'redis';

const trace = debugFactory('FileService:RedisService');

@injectable({scope: BindingScope.SINGLETON})
export class RedisService {
  private _client: RedisClientType | null;

  public get client(): RedisClientType {
    return this._client as RedisClientType;
  }

  constructor(
    @config('', {optional: true})
    private configs: RedisClientOptions | undefined,
  ) {
    trace(this.configs);
    this._client = createClient(configs);
  }

  async connect() {
    trace('Connecting to redis server');
    return this._client?.connect();
  }

  async disconnect() {
    trace('Disconnecting from redis server');
    return this._client?.disconnect();
  }
}
