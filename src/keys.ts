import { BindingKey } from '@loopback/core';
import { TokenController } from './controllers';
import { FileServiceDataSource, FileStorageDataSourceConfig, KeycloakDataSource } from './datasources';
import {
  KeycloakConnectService,
  KeycloakWrapperService,
  RedisService,
  UploadRequestHandlerService,
  FileService as BaseFileService
} from './services';
import { COMMON_TYPES } from './types';
import { Keycloak } from 'keycloak-connect';

export namespace FileService {
  export const HEADER_TOKEN = 'file-token';
  export const SERVER_URL = BindingKey.create<string>('server_url');

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
    FILE_SERVICE: { name: 'file-service', type: 'x-delayed-message' },
  };
  export const RmqQueues = {
    FILE_REQUEST: { name: 'file-upload-request', routeKey: 'file-request' },
  };
  export enum RmqRouteKeys { }
}

export namespace COMMON_KEYS {
  export const KEYCLOAK_DATASOURCE_CONFIG = BindingKey.create<
    Partial<COMMON_TYPES.RestDataSourceConfig>
  >('datasources.config.Keycloak');
  export const KEYCLOAK_DATASOURCE = BindingKey.create<KeycloakDataSource>(
    'datasources.Keycloak',
  );

  export const FILE_SERVICE = BindingKey.create<BaseFileService>(
    'services.FileService',
  );
  export const KEYCLOAK_SERVICE =
    BindingKey.create<Keycloak>('services.Keycloak');
  export const KEYCLOAK_WAPPER_SERVICE =
    BindingKey.create<KeycloakWrapperService>(
      'services.KeycloakWrapperService',
    );

  export const KEYCLOAK_CONNECTOR_SERVICE =
    BindingKey.create<KeycloakConnectService>(
      'services.KeycloakConnectService',
    );

  export const FILE_SERVICE_DATASOURCE =
    BindingKey.create<FileServiceDataSource>('datasources.FileService');

  export const FILE_SERVICE_DATASOURCE_CONFIG = BindingKey.create<
    Partial<COMMON_TYPES.RestDataSourceConfig>
  >('datasources.config.FileService');

  export const REDIS_SERVICE = BindingKey.create<RedisService>(
    'services.RedisService',
  );
}
