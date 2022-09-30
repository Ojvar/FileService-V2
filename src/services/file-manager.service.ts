import {/* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {FILE_MANAGER_SERVICE} from '../dto';
import {FILE_SERVICE_KEYS} from '../keys';
import {Token} from '../models';
import {RedisService} from './redis.service';

@injectable({scope: BindingScope.APPLICATION})
export class FileManagerService {
  async getToken(
    data: FILE_MANAGER_SERVICE.GetTokenRequestDTO,
  ): Promise<FILE_MANAGER_SERVICE.GetTokenResponseDTO> {
    /* Generate new token */
    const token = new Token({
      allowed_files: data.allowed_files,
      expire_time: data.expire_time,
      allowed_user: data.allowed_user,
    });

    /* Save data to redis */
    const redisKey = `${token.id}:${token.allowed_user}`;
    this.redisService.client.SET(redisKey, JSON.stringify(token), {
      EX: token.expire_time ? +token.expire_time : undefined,
    });

    return {id: token.id, expire_at: token.expire_time};
  }

  constructor(
    @inject(FILE_SERVICE_KEYS.REDIS_SERVICE) private redisService: RedisService,
  ) {}
}
