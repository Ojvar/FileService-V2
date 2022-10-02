import {BindingKey} from '@loopback/core';
import {RedisClientOptions} from 'redis';
import {FileManagerService, RedisClient} from './services';
import {FileUploadHandler} from './types';

export namespace FILE_SERVICE_KEYS {
  export const REDIS_SERVICE_CONFIG = BindingKey.create<RedisClientOptions>(
    'services.config.RedisService',
  );
  export const REDIS_SERVICE = BindingKey.create<RedisClient>(
    'services.RedisService',
  );
  export const FILE_MANAGER_SERVICE = BindingKey.create<FileManagerService>(
    'services.FileManagerService',
  );
  export const FILE_UPLOAD_SERVICE = BindingKey.create<FileUploadHandler>(
    'services.FileService',
  );
  export const STORAGE_DIRECTORY =
    BindingKey.create<string>('storage.directory');
}
