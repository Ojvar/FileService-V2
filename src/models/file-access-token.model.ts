/* eslint-disable @typescript-eslint/naming-convention */
import {Model, model, property} from '@loopback/repository';
import {ObjectId} from 'bson';

@model()
export class FileAccessToken extends Model {
  @property({type: 'string'}) token: string;
  @property({type: 'string'}) user_id: string;
  @property({type: 'string'}) file_id: string;
  @property({type: 'string'}) expire_time: number;

  static getRedisKey(token: string): string {
    return `fat_${token}`;
  }

  get redisKey(): string {
    return FileAccessToken.getRedisKey(this.token);
  }

  toJson(): string {
    return JSON.stringify({
      file_id: this.file_id,
      user_id: this.user_id,
    });
  }

  constructor(data?: Partial<FileAccessToken>) {
    super(data);
    this.token = this.token || new ObjectId().toHexString();
  }
}
