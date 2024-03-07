import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {unlink} from 'fs';
import {UploadFileItem} from '../controllers';
import {FileService} from '../keys';
import {EnumRequestTokenStatus, RequestToken} from '../models';
import {RedisService} from './redis.service';

@injectable({scope: BindingScope.TRANSIENT})
export class UploadRequestHandlerService {
  constructor(
    @inject(FileService.REDIS_SERVICE) private redisService: RedisService,
  ) {}

  async checkHeader(
    request: Request,
    ref: string,
    field: string,
    files: UploadFileItem[],
  ) {
    /* Check file */
    if (files.length === 0) {
      throw new HttpErrors.UnprocessableEntity('Invalid uploaded file');
    }

    /* Check token and fetch data from redis */
    const token = request.header(FileService.HEADER_TOKEN);
    const requestStr = !!token && (await this.redisService.client.GET(token));

    /* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */
    const requestData = RequestToken.toJSON(requestStr || '{}');

    if (
      requestData.status !== EnumRequestTokenStatus.NONE ||
      requestData.ref !== ref
    ) {
      this.removeFiles(files);
      throw new HttpErrors.UnprocessableEntity('Invalid Token or Reference');
    }

    const acceptableField = requestData.allowed_files.find(x => x === field);
    if (acceptableField === undefined) {
      this.removeFiles(files);
      throw new HttpErrors.NotAcceptable('Field is not addmited');
    }

    return requestData;
  }

  removeFiles(files: UploadFileItem[]) {
    files.forEach(file => unlink(file.path, console.error));
  }
}
