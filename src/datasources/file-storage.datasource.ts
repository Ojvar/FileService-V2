import {
  BindingKey,
  inject,
  LifeCycleObserver,
  lifeCycleObserver,
} from '@loopback/core';
import {juggler} from '@loopback/repository';

export type FileStorageDataSourceConfig = {
  url: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

const config = {
  name: 'FileStorage',
  connector: 'mongodb',
  // url: '',
  // host: 'localhost',
  // port: 27017,
  // user: '',
  // password: '',
  // database: 'file_storage_db',
  useNewUrlParser: true,
};

@lifeCycleObserver('datasource')
export class FileStorageDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'FileStorage';
  static readonly defaultConfig = config;

  static BINDING_KEY = BindingKey.create<FileStorageDataSource>(
    `datasources.${FileStorageDataSource.dataSourceName}`,
  );
  static CONFIG_BINDING_KEY = BindingKey.create<FileStorageDataSourceConfig>(
    `datasources.config.${FileStorageDataSource.dataSourceName}`,
  );

  constructor(
    @inject(FileStorageDataSource.CONFIG_BINDING_KEY, {
      optional: true,
    })
    dsConfig?: FileStorageDataSource | undefined,
  ) {
    super({...(dsConfig ?? {}), ...config});
    this.once('connected', () => {
      this.autoupdate()
        .then(() =>
          console.log(`${FileStorageDataSource.dataSourceName} AutoUpdated`),
        )
        .catch(console.error);
    });
    this.on('error', error => {
      console.error(error);
      process.exit(-1);
    });
  }
}
