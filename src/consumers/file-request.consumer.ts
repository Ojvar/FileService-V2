/* eslint-disable @typescript-eslint/naming-convention */
import {inject} from '@loopback/core';
import debugFactory from 'debug';
import {unlink} from 'fs';
import {ConsumeMessage, rabbitConsume} from 'loopback-rabbitmq';
import {resolve} from 'path';
import {FileService} from '../keys';
import {RequestToken} from '../models';
import {RedisService} from '../services';

const trace = debugFactory('FileService:FileRequestConsumer');

export class FileRequestConsumer {
  constructor(@inject(FileService.REDIS_SERVICE) private redis: RedisService) {}

  @rabbitConsume({
    exchange: FileService.RmqExchanges.FILE_SERVICE.name,
    routingKey: FileService.RmqQueues.FILE_REQUEST.routeKey,
    queue: FileService.RmqQueues.FILE_REQUEST.name,
  })
  async handle(message: string, rawMessage: ConsumeMessage) {
    try {
      trace(message);

      const request = await this.redis.client.GETDEL(message);
      trace(request);
      if (!request) {
        return;
      }

      const reuqestData = new RequestToken(JSON.parse(request));
      trace(reuqestData);

      /* Delete file, if request was not commited */
      if (!reuqestData.commited) {
        Object.entries(reuqestData.uploaded_files).forEach(([key, value]) => {
          unlink(resolve(value.path), err => {
            if (err) {
              console.error(err);
            }
          });
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
}
