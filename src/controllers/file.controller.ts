/* eslint-disable @typescript-eslint/naming-convention */
import {inject, intercept} from '@loopback/core';
import {get, HttpErrors, param, response} from '@loopback/rest';
// import debugFactory from 'debug';
import {protect} from '../interceptors';
import {FileService} from '../keys';
import {EnumRequestTokenStatus, FileData, RequestToken} from '../models';
import {RedisService} from '../services';

// const trace = debugFactory('FileService:FileController');

export class FileController {
  constructor(@inject(FileService.REDIS_SERVICE) private redis: RedisService) {}

  @intercept(protect('realm:no-body'))
  @get('/file')
  @response(200, {
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            id: {type: 'string'},
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
    const request = await this.redis.client.GET(fileToken);
    const fileRequest = RequestToken.toJSON(request);

    if (fileRequest?.status === EnumRequestTokenStatus.DISMISSED) {
      throw new HttpErrors.BadRequest('Access denied');
    }

    if (!fileRequest.uploaded_files) {
      return {};
    } else {
      Object.values(fileRequest.uploaded_files).forEach(
        value => (value.path = value.filename),
      );

      return fileRequest.uploaded_files ?? {};
    }
  }
}
