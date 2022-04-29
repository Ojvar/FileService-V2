/* eslint-disable @typescript-eslint/naming-convention */
// Uncomment these imports to begin using these cool features!

import {config, inject} from '@loopback/core';
import {HttpErrors, post, requestBody, response} from '@loopback/rest';
import {v4 as uuidV4} from 'uuid';
import {expiredAtSeconds} from '../helpers/datetime.helper';
import {FileService} from '../keys';
import {RequestToken} from '../models';
import {RedisService} from '../services';

export class TokenController {
  constructor(
    @config() private configs: RequestConfig,
    @inject(FileService.REDIS_SERVICE) private redis: RedisService,
  ) {
    console.log(this.configs);
  }

  @post('/token')
  @response(200, {content: {'text/plain': {schema: {type: 'string'}}}})
  async requestToken(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['userId', 'ref', 'files'],
            properties: {
              userId: {type: 'string'},
              ref: {type: 'string'},
              files: {type: 'array', items: {type: 'string'}},
            },
          },
        },
      },
    })
    body: TokenRequestBody,
  ): Promise<string> {
    const key = uuidV4();

    const requestData: RequestToken = new RequestToken({
      created_at: new Date(),
      ref: body.ref,
      user_id: body.userId,
      files: body.files,
      commited: false,
    });

    /* Store data */
    try {
      await this.redis.client.SET(key, requestData.toString(), {
        EXAT: +expiredAtSeconds(this.configs.requestExpireSeconds),
      });

      return key;
    } catch (err) {
      throw new HttpErrors.InternalServerError();
    }
  }
}

export type TokenRequestBody = {
  userId: string;
  ref: string;
  files: string[];
};

export type RequestConfig = {
  requestExpireSeconds: number;
};
