/* eslint-disable @typescript-eslint/naming-convention */
import {config, inject, intercept} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  del,
  HttpErrors,
  param,
  patch,
  post,
  Request,
  requestBody,
  response,
  RestBindings,
} from '@loopback/rest';
import {Keycloak} from 'keycloak-connect';
// import debugFactory from 'debug';
import {RabbitmqBindings, RabbitmqProducer} from 'loopback-rabbitmq';
import {v4 as uuidV4} from 'uuid';
import {protect} from '../interceptors';
import {FileService} from '../keys';
import {EnumRequestTokenStatus, RequestToken} from '../models';
import {FileRepository} from '../repositories';
import {RedisService} from '../services';
import {BaseController} from './base.controller';

// const trace = debugFactory('FileService:TokenController');

export class TokenController extends BaseController {
  constructor(
    @config() private configs: RequestConfig,
    @inject(FileService.REDIS_SERVICE) private redis: RedisService,
    @inject(RabbitmqBindings.RABBITMQ_PRODUCER)
    private rabbitmqProducer: RabbitmqProducer,
    @inject(RestBindings.Http.REQUEST) protected req: Request,
    @inject(FileService.KEYCLOAK_CONNECTOR_SERVICE)
    keycloak: Keycloak,
  ) {
    super(req, keycloak);
  }

  @intercept(protect('realm:no-body'))
  @post('/token')
  @response(200, {content: {'text/plain': {schema: {type: 'string'}}}})
  async requestToken(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['ref', 'files'],
            properties: {
              ref: {type: 'string'},
              allowedFiles: {type: 'array', items: {type: 'string'}},
            },
          },
        },
      },
    })
    body: TokenRequestBody,
  ): Promise<string> {
    const userInfo = await this.getUserInfo();

    const requestData: RequestToken = new RequestToken({
      key: uuidV4(),
      created_at: new Date(),
      ref: body.ref,
      user_id: userInfo.sub,
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
    /* Get request data from redis */
    let reuqestStr = await this.redis.client.GET(token);
    const requestData = RequestToken.toJSON(reuqestStr);
    if (requestData.status !== EnumRequestTokenStatus.NONE) {
      throw new HttpErrors.UnprocessableEntity();
    }

    /* Save to database and update requestData */
    const keys = Object.keys(requestData.uploaded_files);

    for (const key of keys) {
      try {
        const file = requestData.uploaded_files[key];
        const savedFile = await fileRepository.create({
          filename: file.filename,
          original_name: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          uploaded: {
            at: requestData.created_at,
            by: requestData.user_id,
          },
        });

        requestData.uploaded_files[key].id = savedFile.getId();
      } catch (err) {
        /* TODO: GATHERING ERROR */
        console.error(err);
      }
    }

    await this.updateRequestData(
      token,
      EnumRequestTokenStatus.COMMITED,
      requestData,
    );
  }

  async updateRequestData(
    token: string,
    statue: EnumRequestTokenStatus,
    requestData?: RequestToken,
  ): Promise<RequestToken> {
    if (!requestData) {
      const reqStr = await this.redis.client.GET(token);
      requestData = RequestToken.toJSON(reqStr);
      if (requestData.status !== EnumRequestTokenStatus.NONE) {
        throw new HttpErrors.UnprocessableEntity();
      }
    }

    /* Update request data */
    requestData.status = statue;
    await this.redis.client.SET(token, requestData.toString());

    return requestData;
  }
}

export type TokenRequestBody = {
  ref: string;
  allowedFiles: string[];
};

export type RequestConfig = {
  requestExpireMiliSeconds: number;
};
