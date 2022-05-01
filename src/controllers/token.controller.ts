/* eslint-disable @typescript-eslint/naming-convention */
// Uncomment these imports to begin using these cool features!

import {config, inject} from '@loopback/core';
import {
  del,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import debugFactory from 'debug';
import {unlink} from 'fs';
import {RabbitmqBindings, RabbitmqProducer} from 'loopback-rabbitmq';
import {resolve} from 'path';
import {v4 as uuidV4} from 'uuid';
import {FileService} from '../keys';
import {RequestToken} from '../models';
import {RedisService} from '../services';

const trace = debugFactory('FileService:TokenController');

export class TokenController {
  constructor(
    @config() private configs: RequestConfig,
    @inject(FileService.REDIS_SERVICE) private redis: RedisService,
    @inject(RabbitmqBindings.RABBITMQ_PRODUCER)
    private rabbitmqProducer: RabbitmqProducer,
  ) {}

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
              allowedFiles: {type: 'array', items: {type: 'string'}},
            },
          },
        },
      },
    })
    body: TokenRequestBody,
  ): Promise<string> {
    const requestData: RequestToken = new RequestToken({
      key: uuidV4(),
      created_at: new Date(),
      ref: body.ref,
      user_id: body.userId,
      allowed_files: body.allowedFiles,
      commited: false,
    });

    /* Store data */
    try {
      await this.redis.client.SET(requestData.key, requestData.toString(), {
        // EXAT: +expiredAtSeconds(this.configs.requestExpireMiliSeconds ),
      });

      /* Publish rabbitmq message - delayed message,
         to delete this record from redis db after a specified time */
      this.rabbitmqProducer.publish(
        FileService.RmqExchanges.FILE_SERVICE.name,
        FileService.RmqQueues.FILE_REQUEST.routeKey,
        requestData,
        {headers: {'x-delay': this.configs.requestExpireMiliSeconds}},
      );

      return requestData.key;
    } catch (err) {
      throw new HttpErrors.InternalServerError();
    }
  }

  @del('/token/{token}')
  @response(200, {
    description: 'Dismiss a token, and delete all uploaded files',
  })
  async dismiss(@param.path.string('token') token: string) {
    /* Try to delete uploaded files */
    const reqStr = await this.redis.client.GET(token);
    if (!reqStr) {
      throw new HttpErrors.UnprocessableEntity();
    }

    /* Remove from redis */
    await this.redis.client.DEL(token);

    /* Delete all files */
    const request: RequestToken = RequestToken.toJSON(reqStr);
    trace(request);

    Object.entries(request.uploaded_files).forEach(([key, value]) => {
      unlink(resolve(value.path), err => {
        if (err) {
          console.error(err);
        }
      });
    });
  }

  @patch('/token/{token}')
  async commit(@param.path.string('token') token: string) {
    await this.redis.client.DEL(token);
  }
}

export type TokenRequestBody = {
  userId: string;
  ref: string;
  allowedFiles: string[];
};

export type RequestConfig = {
  requestExpireMiliSeconds: number;
};
