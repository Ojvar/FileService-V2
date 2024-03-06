/* eslint-disable @typescript-eslint/naming-convention */
import { inject, LifeCycleObserver, lifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';
import debugFactory from 'debug';
import { COMMON_KEYS } from '../keys';
import { COMMON_TYPES } from '../types';
const trace = debugFactory('Common:Keycloak.DataSource');

const config = {
  name: 'Keycloak',
  connector: 'rest',
  baseURL: '',
  crud: false,
};

const getConfig = (
  data: COMMON_TYPES.RestDataSourceConfig,
): COMMON_TYPES.RestDataSourceConfig => {
  return {
    ...data,
    operations: [
      {
        template: {
          method: 'GET',
          url: `${data.baseURL}/auth/realms/qeng/protocol/openid-connect/certs`,
        },
        functions: { certs: [] },
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
  implements LifeCycleObserver {
  static dataSourceName = 'Keycloak';
  static readonly defaultConfig = config;

  constructor(
    @inject(COMMON_KEYS.KEYCLOAK_DATASOURCE_CONFIG, {
      optional: true,
    })
    dsConfig: Partial<COMMON_TYPES.RestDataSourceConfig> = config,
  ) {
    dsConfig = getConfig(Object.assign(config, dsConfig));
    trace(dsConfig, config);
    super(dsConfig);
  }
}
