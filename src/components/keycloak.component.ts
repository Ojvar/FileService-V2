import {
  Application,
  Component,
  ContextTags,
  CoreBindings,
  createBindingFromClass,
  createServiceBinding,
  inject,
} from '@loopback/core';
import {KeycloakDataSource} from '../datasources';
import {COMMON_KEYS} from '../keys';
import {
  KeycloakConnectServiceProvider,
  KeycloakProvider,
  KeycloakWrapperService,
} from '../services';

export class KeycloakComponent implements Component {
  constructor(@inject(CoreBindings.APPLICATION_INSTANCE) app: Application) {
    app.add(
      createBindingFromClass(KeycloakDataSource, {
        [ContextTags.KEY]: COMMON_KEYS.KEYCLOAK_DATASOURCE,
      }),
    );
    app.add(createServiceBinding(KeycloakConnectServiceProvider));
    app.add(createServiceBinding(KeycloakProvider));
    app.add(createServiceBinding(KeycloakWrapperService));
  }
}
