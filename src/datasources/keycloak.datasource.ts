import {inject, LifeCycleObserver, lifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {COMMON_KEYS} from '../keys';
import {COMMON_TYPES} from '../types';

const config = {
  name: 'Keycloak',
  connector: 'rest',
  // baseURL: '',
  crud: false,
};

const getConfig = (
  data: Partial<COMMON_TYPES.RestDataSourceConfig>,
): object => {
  return {
    ...data,
    operations: [
      {
        template: {
          method: 'GET',
          url: `${data.baseURL}/auth/realms/qeng/protocol/openid-connect/certs`,
        },
        functions: {certs: []},
      },
    ],
  };
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class KeycloakDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'Keycloak';
  static readonly defaultConfig = config;

  constructor(
    @inject(COMMON_KEYS.KEYCLOAK_DATASOURCE_CONFIG, {
      optional: true,
    })
    dsConfig: object = config,
  ) {
    super(getConfig({...dsConfig, ...config}));
  }
}
