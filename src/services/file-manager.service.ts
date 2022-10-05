import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {FILE_MANAGER_SERVICE_DTO} from '../dto';
import {Token} from '../models';
import {RedisService, REDIS_SERVICE} from './redis.service';

@injectable({scope: BindingScope.APPLICATION})
export class FileManagerService {
  async getToken(
    data: FILE_MANAGER_SERVICE_DTO.GetTokenRequestDTO,
  ): Promise<FILE_MANAGER_SERVICE_DTO.GetTokenResponseDTO> {
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

  /* TODO: ADD RESULT TYPE */
  getUploadedFile(request: Request) {
    const uploadedFile = request.file;
    if (!uploadedFile) {
      throw new HttpErrors.UnprocessableEntity('Empty file');
    }

    const {fieldname, mimetype, originalname, size} = uploadedFile;
    const file = {
      id: uploadedFile.filename,
      fieldname,
      mimetype,
      originalname,
      size,
    };
    return {file, body: request.body};
  }

  constructor(@inject(REDIS_SERVICE) private redisService: RedisService) {}
}

export const FILE_MANAGER_SERVICE = BindingKey.create<FileManagerService>(
  'services.FileManagerService',
);
