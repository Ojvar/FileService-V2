import {BindingKey} from '@loopback/core';
import {TokenController} from './controllers';
import {RedisService} from './services';

export namespace FileService {
  export const REDIS_SERVICE = BindingKey.create<RedisService>(
    'services.RedisService',
  );
  export const TOKEN_CONTROLLER = BindingKey.create<TokenController>(
    'controllers.TokenController',
  );
}
