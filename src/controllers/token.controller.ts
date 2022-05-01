/* eslint-disable @typescript-eslint/naming-convention */
import {config, inject} from '@loopback/core';
import {repository} from '@loopback/repository';
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
import {RabbitmqBindings, RabbitmqProducer} from 'loopback-rabbitmq';
import {v4 as uuidV4} from 'uuid';
import {FileService} from '../keys';
import {EnumRequestTokenStatus, RequestToken} from '../models';
import {FileRepository} from '../repositories';
import {RedisService} from '../services';
import {UploadFileItem} from './upload.controller';

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
      status: EnumRequestTokenStatus.NONE,
    });

    try {
      /* Store data into redis */
      await this.redis.client.SET(requestData.key, requestData.toString(), {
        // EXAT: +expiredAtSeconds(this.configs.requestExpireMiliSeconds ),
      });

      /* Publish rabbitmq message - delayed message,
         to delete this record from redis db after a specified time */
      await this.rabbitmqProducer.publish(
        FileService.RmqExchanges.FILE_SERVICE.name,
        FileService.RmqQueues.FILE_REQUEST.routeKey,
        requestData.key,
        {headers: {'x-delay': this.configs.requestExpireMiliSeconds}},
      );

      return requestData.key;
    } catch (err) {
      throw new HttpErrors.InternalServerError();
    }
  }

  @del('/token')
  @response(200, {
    description: 'Dismiss a token, and delete all uploaded files',
  })
  async dismiss(@param.header.string('file-token') token: string) {
    await this.updateRequestData(token, EnumRequestTokenStatus.DISMISSED);
  }

  @patch('/token')
  async commit(
    @param.header.string('file-token') token: string,
    @repository(FileRepository) fileRepository: FileRepository,
  ) {
    const reuqestData = await this.updateRequestData(
      token,
      EnumRequestTokenStatus.COMMITED,
    );

    /* Save to database */
    trace('COMMIT', reuqestData);
    Object.values(reuqestData.uploaded_files).forEach(
      async (file: UploadFileItem) => {
        try {
          await fileRepository.create({
            filename: file.filename,
            original_name: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploaded: {
              at: reuqestData.created_at,
              by: reuqestData.user_id,
            },
          });
        } catch (err) {
          /* TODO: GATHERING ERROR */
          console.error(err);
        }
      },
    );
  }

  async updateRequestData(
    token: string,
    statue: EnumRequestTokenStatus,
  ): Promise<RequestToken> {
    /* Try to delete uploaded files */
    const reqStr = await this.redis.client.GET(token);
    const requestData = RequestToken.toJSON(reqStr);
    if (requestData.status !== EnumRequestTokenStatus.NONE) {
      throw new HttpErrors.UnprocessableEntity();
    }

    /* Update request data */
    requestData.status = statue;
    await this.redis.client.SET(token, requestData.toString());

    return requestData;
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
