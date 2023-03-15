import {
  BindingKey,
  inject,
  lifeCycleObserver,
  LifeCycleObserver,
} from '@loopback/core';
import {juggler} from '@loopback/repository';

export const FILE_STORAGE_DATASOURCE_CONFIG = BindingKey.create<object>(
  'datasources.config.FileStorage',
);
export const FILE_STORAGE_DATASOURCE = BindingKey.create<FileStorageDataSource>(
  'datasources.FileStorage',
);

const config = {
  name: 'FileStorage',
  connector: 'mongodb',
  url: '',
  host: 'localhost',
  port: 27017,
  user: '',
  password: '',
  database: 'file_storage_db',
  useNewUrlParser: true,
};

@lifeCycleObserver('datasource')
export class FileStorageDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'FileStorage';
  static readonly defaultConfig = config;

  constructor(
    @inject(FILE_STORAGE_DATASOURCE_CONFIG, {optional: true})
    dsConfig: object = config,
  ) {
    Object.assign(dsConfig, {
      name: config.name,
      connector: config.connector,
      useNewUrlParser: config.useNewUrlParser,
    });
    super(dsConfig);
  }
}
