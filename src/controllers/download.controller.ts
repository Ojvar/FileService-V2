import {inject, intercept} from '@loopback/core';
import {
  get,
  HttpErrors,
  oas,
  param,
  Response,
  RestBindings,
} from '@loopback/rest';
import {existsSync} from 'fs';
// import debugFactory from 'debug';
import path from 'path';
import {protect} from '../interceptors';
import {FileService} from '../keys';

// const trace = debugFactory('FileService:DownloadController');

export class DownloadController {
  constructor(
    @inject(FileService.STORAGE_DIRECTORY) private storageDirectory: string,
  ) {}

  @intercept(protect('realm:no-body'))
  @get('/file/{filename}')
  @oas.response.file()
  downloadFile(
    @param.path.string('filename') fileName: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
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
