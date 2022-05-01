import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import debugFactory from 'debug';
import {unlink} from 'fs';
import {UploadFileItem} from '../controllers';
import {FileService} from '../keys';
import {RequestToken} from '../models';
import {RedisService} from './redis.service';

const trace = debugFactory('FileService:UploadRequestHandlerService');

@injectable({scope: BindingScope.TRANSIENT})
export class UploadRequestHandlerService {
  constructor(
    @inject(FileService.REDIS_SERVICE) private redisService: RedisService,
  ) {}

  async checkHeader(request: Request, field: string, files: UploadFileItem[]) {
    /* Check file */
    if (files.length === 0) {
      throw new HttpErrors.UnprocessableEntity('Invalid uploaded file');
    }

    /* Check token and fetch data from redis */
    const token = request.header(FileService.HEADER_TOKEN);
    trace(token);

    const redisData = !!token && (await this.redisService.client.GET(token));
    trace(redisData);

    if (!redisData) {
      this.removeFiles(files);
      throw new HttpErrors.UnprocessableEntity('Invalid Token');
    }

    const fileRequest: RequestToken = new RequestToken(JSON.parse(redisData));
    trace(fileRequest);

    const acceptableField = fileRequest.allowed_files.find(x => x === field);
    if (acceptableField === undefined) {
      this.removeFiles(files);
      throw new HttpErrors.NotAcceptable('Field is not addmited');
    }

    return fileRequest;
  }

  removeFiles(files: UploadFileItem[]) {
    files.forEach(file => unlink(file.path, console.error));
  }
}
