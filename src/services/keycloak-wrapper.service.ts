import {
  BindingScope,
  inject,
  injectable,
  LifeCycleObserver,
  lifeCycleObserver,
} from '@loopback/core';
import JsonWebToken from 'jsonwebtoken';
import {CertResponseDTO} from '../dto/keycloak.dto';
import {COMMON_KEYS} from '../keys';
import {Keycloak} from './keycloak.service';

@lifeCycleObserver('services')
@injectable({scope: BindingScope.APPLICATION})
export class KeycloakWrapperService implements LifeCycleObserver {
  private _cert: CertResponseDTO;
  private _x5c: string;

  validateToken(accessToken: string): string | JsonWebToken.JwtPayload {
    return JsonWebToken.verify(accessToken, this.token);
  }

  async updatePublicToken() {
    this._cert = await this.keycloak.certs();
    const {keys} = this._cert;
    this._x5c = keys[0].x5c[0];
  }

  async start() {
    await this.updatePublicToken();
  }

  get token(): string {
    return `-----BEGIN CERTIFICATE-----\n${this._x5c}\n-----END CERTIFICATE----- `;
  }

  constructor(
    @inject(COMMON_KEYS.KEYCLOAK_SERVICE) private keycloak: Keycloak,
  ) {}
}
