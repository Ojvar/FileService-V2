import {BindingKey} from '@loopback/core';
import {TokenController} from './controllers';
import {FileStorageDataSourceConfig} from './datasources';
import {
  KeycloakConnectService,
  RedisService,
  UploadRequestHandlerService,
} from './services';

export namespace FileService {
  export const HEADER_TOKEN = 'file-token';

  export const STORAGE_DIRECTORY =
    BindingKey.create<string>('storage.directory');
  export const KEYCLOAK_CONNECTOR_SERVICE =
    BindingKey.create<KeycloakConnectService>(
      'services.KeycloakConnectService',
    );
  export const DS_CONFIG_FILE_STORAGE =
    BindingKey.create<FileStorageDataSourceConfig>(
      'datasources.config.FileStorage',
    );
  export const UPLOAD_REQUEST_HANDLER_SERVICE =
    BindingKey.create<UploadRequestHandlerService>(
      'services.UploadRequestHandlerService',
    );

  export const REDIS_SERVICE = BindingKey.create<RedisService>(
    'services.RedisService',
  );
  export const TOKEN_CONTROLLER = BindingKey.create<TokenController>(
    'controllers.TokenController',
  );

  export const RmqExchanges = {
    FILE_SERVICE: {name: 'file-service', type: 'x-delayed-message'},
  };
  export const RmqQueues = {
    FILE_REQUEST: {name: 'file-upload-request', routeKey: 'file-request'},
  };
  export enum RmqRouteKeys {}
}
