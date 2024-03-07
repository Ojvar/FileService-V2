import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {KeycloakDataSource} from '../datasources';
import {CertResponseDTO} from '../dto/keycloak.dto';
import {COMMON_KEYS} from '../keys';

export interface Keycloak {
  certs(): Promise<CertResponseDTO>;
}

export class KeycloakProvider implements Provider<Keycloak> {
  constructor(
    // Keycloak must match the name property in the datasource json file
    @inject(COMMON_KEYS.KEYCLOAK_DATASOURCE)
    protected dataSource: KeycloakDataSource = new KeycloakDataSource(),
  ) {}

  value(): Promise<Keycloak> {
    return getService(this.dataSource);
  }
}
