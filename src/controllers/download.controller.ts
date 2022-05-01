import {inject} from '@loopback/core';
import {
  get,
  HttpErrors,
  oas,
  param,
  Response,
  RestBindings,
} from '@loopback/rest';
import debugFactory from 'debug';
import path from 'path';
import {FileService} from '../keys';

const trace = debugFactory('FileService:DownloadController');

/* TODO: add JWT token check */
export class DownloadController {
  constructor(
    @inject(FileService.STORAGE_DIRECTORY) private storageDirectory: string,
  ) {}

  @get('/file/{filename}')
  @oas.response.file()
  downloadFile(
    @param.path.string('filename') fileName: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    const file = this.validateFileName(fileName);
    response.download(file, fileName);

    return response;
  }

  private validateFileName(fileName: string) {
    const resolved = path.resolve(this.storageDirectory, fileName);
    trace(resolved);

    if (resolved.startsWith(this.storageDirectory)) {
      return resolved;
    }

    throw new HttpErrors.BadRequest(`Invalid file name: ${fileName}`);
  }
}
