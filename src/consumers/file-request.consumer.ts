/* eslint-disable @typescript-eslint/naming-convention */
import { inject } from '@loopback/core';
import { repository } from '@loopback/repository';
// import debugFactory from 'debug';
import { unlink } from 'fs';
import { rabbitConsume } from 'loopback-rabbitmq';
import { resolve } from 'path';
import { FileService } from '../keys';
import { EnumRequestTokenStatus, RequestToken } from '../models';
import { FileRepository } from '../repositories';
import { RedisService } from '../services';

// const trace = debugFactory('FileService:FileRequestConsumer');

export class FileRequestConsumer {
  constructor(
    @inject(FileService.REDIS_SERVICE) private redis: RedisService,
    @repository(FileRepository) private fileRepository: FileRepository,
  ) { }

  @rabbitConsume({
    exchange: FileService.RmqExchanges.FILE_SERVICE.name,
    routingKey: FileService.RmqQueues.FILE_REQUEST.routeKey,
    queue: FileService.RmqQueues.FILE_REQUEST.name,
  })
  async handle(message: string) {
    try {
      const request = await this.redis.client.GETDEL(message);
      const requestData = RequestToken.toJSON(request);

      /* Delete file, if request was not commited */
      if (
        requestData.status !== EnumRequestTokenStatus.COMMITED &&
        !!requestData.uploaded_files
      ) {
        await Promise.all([
          this.cleanDatabase(requestData),
          this.cleanStorage(requestData),
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async cleanDatabase(requestData: RequestToken) {
    const fileIds = Object.values(requestData.uploaded_files).map(x => x.id);
    return this.fileRepository.deleteAll({ id: { inq: fileIds } });
  }

  private async cleanStorage(requestData: RequestToken) {
    Object.entries(requestData.uploaded_files).forEach(([_key, value]) => {
      unlink(resolve(value.path), err => {
        if (err) {
          console.error(err);
        }
      });
    });
  }
}
