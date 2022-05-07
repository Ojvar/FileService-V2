import {BindingScope, config, injectable} from '@loopback/core';
import debugFactory from 'debug';
import {createClient, RedisClientOptions, RedisClientType} from 'redis';
import {EventEmitter} from 'stream';

const trace = debugFactory('FileService:RedisService');

export enum EnumEvents {
  SETUP_CONFIGS = 'setup_configs',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

@injectable({scope: BindingScope.SINGLETON})
export class RedisService extends EventEmitter {
  private _client: RedisClientType | null;

  public get client(): RedisClientType {
    return this._client as RedisClientType;
  }

  constructor(
    @config('', {optional: true})
    private configs: RedisClientOptions | undefined,
  ) {
    super();

    trace(this.configs);
    this._client = createClient(configs);
  }

  async connect() {
    trace('Connecting to redis server');
    await this.client.connect();

    this.emit(EnumEvents.CONNECTED, this);
  }

  async disconnect() {
    trace('Disconnecting from redis server');
    await this.client.disconnect();

    this.emit(EnumEvents.DISCONNECTED, this);
  }
}
