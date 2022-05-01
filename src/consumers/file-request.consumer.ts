/* eslint-disable @typescript-eslint/naming-convention */
import {inject} from '@loopback/core';
// import debugFactory from 'debug';
import {unlink} from 'fs';
import {ConsumeMessage, rabbitConsume} from 'loopback-rabbitmq';
import {resolve} from 'path';
import {FileService} from '../keys';
import {EnumRequestTokenStatus, RequestToken} from '../models';
import {RedisService} from '../services';

// const trace = debugFactory('FileService:FileRequestConsumer');

export class FileRequestConsumer {
  constructor(@inject(FileService.REDIS_SERVICE) private redis: RedisService) {}

  @rabbitConsume({
    exchange: FileService.RmqExchanges.FILE_SERVICE.name,
    routingKey: FileService.RmqQueues.FILE_REQUEST.routeKey,
    queue: FileService.RmqQueues.FILE_REQUEST.name,
  })
  async handle(message: string, rawMessage: ConsumeMessage) {
    try {
      const request = await this.redis.client.GETDEL(message);
      const reuqestData = RequestToken.toJSON(request);

      /* Delete file, if request was not commited */
      if (reuqestData.status !== EnumRequestTokenStatus.COMMITED) {
        if (!!reuqestData.uploaded_files) {
          Object.entries(reuqestData.uploaded_files).forEach(([key, value]) => {
            unlink(resolve(value.path), err => {
              if (err) {
                console.error(err);
              }
            });
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}
