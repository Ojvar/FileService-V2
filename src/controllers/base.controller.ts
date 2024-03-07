/* eslint-disable @typescript-eslint/naming-convention */
import {Request} from '@loopback/rest';
import {Grant, Keycloak, Token} from 'keycloak-connect';

export type UserInfo = Record<string, unknown> & {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
};

export class BaseController {
  protected _userData: unknown;

  constructor(
    protected req: Request,
    protected keycloak: Keycloak,
  ) {}

  protected async getUserInfo(): Promise<UserInfo> {
    const accessToken = (this.req.kauth.grant as Grant).access_token as Token;
    return this.keycloak.grantManager.userInfo<Token, UserInfo>(accessToken);
  }
}
