/* eslint-disable @typescript-eslint/naming-convention */
// Uncomment these imports to begin using these cool features!

import {inject, intercept} from '@loopback/core';
import {get, HttpErrors, param, response} from '@loopback/rest';
import debugFactory from 'debug';
import {MulterInterceptor} from '../interceptors';
import {FileService} from '../keys';
import {FileData, RequestToken} from '../models';
import {RedisService} from '../services';

const trace = debugFactory('FileService:FileController');

/* TODO: add JWT check token */
export class FileController {
  constructor(@inject(FileService.REDIS_SERVICE) private redis: RedisService) {}

  @intercept(MulterInterceptor.BINDING_KEY)
  @get('/file')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            fieldname: {type: 'string'},
            originalname: {type: 'string'},
            encoding: {type: 'string'},
            mimetype: {type: 'string'},
            size: {type: 'number'},
            destination: {type: 'string'},
            filename: {type: 'string'},
          },
        },
      },
    },
  })
  async requestToken(
    @param.header.string('file-token') fileToken: string,
  ): Promise<Record<string, FileData>> {
    trace(fileToken);

    const fileRequest = await this.redis.client.GET(fileToken);
    trace(fileRequest);
    if (!fileRequest) {
      throw new HttpErrors.BadRequest();
    }

    const request = new RequestToken(JSON.parse(fileRequest));
    trace(request);
    Object.values(request.uploaded_files).forEach(
      value => (value.path = value.filename),
    );
    trace(request);

    return request.uploaded_files ?? {};
  }
}
