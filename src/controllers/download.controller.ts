import {inject} from '@loopback/core';
import {
  get,
  HttpErrors,
  oas,
  param,
  Response,
  RestBindings,
} from '@loopback/rest';
import {existsSync} from 'fs';
import path from 'path';
import {COMMON_KEYS, FileService} from '../keys';
import {KeycloakWrapperService} from '../services';

export class DownloadController {
  constructor(
    @inject(FileService.STORAGE_DIRECTORY) private storageDirectory: string,
    @inject(COMMON_KEYS.KEYCLOAK_WAPPER_SERVICE)
    private keycloakWrapperService: KeycloakWrapperService,
  ) {}

  // @intercept(protect('realm:no-body'))
  @get('/file/{filename}')
  @oas.response.file()
  downloadFile(
    @param.query.string('token') token: string,
    @param.path.string('filename') fileName: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    if (!token) {
      throw new HttpErrors.Unauthorized('Invalid token');
    }

    const data = this.keycloakWrapperService.validateToken(token);
    if (!data) {
      throw new HttpErrors.Unauthorized('Invalid user data');
    }

    const file = this.validateFileName(fileName) as string;
    response.download(file, fileName);
    return response;
  }

  private validateFileName(fileName: string): string | undefined {
    const resolved = path.resolve(this.storageDirectory, fileName);
    if (resolved.startsWith(this.storageDirectory) && existsSync(resolved)) {
      return resolved;
    }
    throw new HttpErrors.BadRequest(`Invalid file name: ${fileName}`);
  }
}
