/* eslint-disable @typescript-eslint/naming-convention */
import {
  Application,
  BindingScope,
  CoreBindings,
  inject,
  injectable,
  Provider,
} from '@loopback/core';
import KeycloakConnect from 'keycloak-connect';
export type KeycloakConnectService = KeycloakConnect.Keycloak;

@injectable({scope: BindingScope.SINGLETON})
export class KeycloakConnectServiceProvider
  implements Provider<KeycloakConnectService>
{
  _kc: KeycloakConnect.Keycloak;

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    private app: Application,
  ) {
    this._kc = new KeycloakConnect({});
  }

  value(): KeycloakConnect.Keycloak {
    return this._kc;
  }
}
