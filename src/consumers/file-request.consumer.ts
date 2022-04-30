/* eslint-disable @typescript-eslint/naming-convention */
import {inject} from '@loopback/core';
import debugFactory from 'debug';
import {ConsumeMessage, rabbitConsume} from 'loopback-rabbitmq';
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
  async handle(message: RequestToken, rawMessage: ConsumeMessage) {
    try {
      trace(message);
      trace(rawMessage);

      /* todo:
      get record data from redis
      delete all files from disk
      delete redis record
      */

      await this.redis.client.DEL(message.key);
    } catch (err) {
      console.error(err);
    }
  }
}
