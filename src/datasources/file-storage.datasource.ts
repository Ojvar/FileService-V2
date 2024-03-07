import {inject, LifeCycleObserver, lifeCycleObserver} from '@loopback/core';
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
  // host: 'knode3.qeng.ir',
  // port: 27017,
  // user: 'qeng_user',
  // password: 'ahmo@@1234',
  // database: 'qeng',
  useNewUrlParser: true,
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class FileStorageDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'FileStorage';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.FileStorage', {optional: true})
    dsConfig: object = config,
  ) {
    super({...dsConfig, ...config});
    super.once('connected', () => {
      super.autoupdate().catch(console.error);
    });
  }

  stop(): void | PromiseLike<void> {
    return super.disconnect();
  }
}
