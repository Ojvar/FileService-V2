import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {unlink} from 'fs/promises';
import path from 'path';
import {FILE_MANAGER_SERVICE_DTO} from '../dto';
import {STORAGE_DIRECTORY} from '../interceptors';
import {Credential, UploadedFile} from '../models';
import {
  CredentialManagerService,
  CREDENTIAL_MANAGER_SERVICE,
} from './credential.manager.service';
import {RedisService, REDIS_SERVICE} from './redis.service';

@injectable({scope: BindingScope.APPLICATION})
export class FileManagerService {
  async uploadFile(
    userId: string,
    token: string,
    field: string,
    request: Request,
  ): Promise<UploadedFile> {
    /* Fix field-name, it is 'file' as default */
    const uploadedFile = this.getUploadedFile(request);
    uploadedFile.fieldname = field;

    const credential = await this.getCredential(userId, token);
    if (!credential?.isValid()) {
      await this.removeFile(uploadedFile);
      throw new HttpErrors.UnprocessableEntity('Invalid token');
    }
    if (!credential.checkAllowedFile(uploadedFile)) {
      await this.removeFile(uploadedFile);
      throw new HttpErrors.UnprocessableEntity(
        'Invalid field-name or file-size',
      );
    }

    /* Remove old uploaded file, and replace new file */
    await this.removeFileIfAlreadyUploaded(credential, uploadedFile);
    credential.addOrReplaceUploadedItem(uploadedFile);

    /* Update redis */
    await this.storeCredential(credential);

    return uploadedFile;
  }

  async removeFileIfAlreadyUploaded(
    credential: Credential,
    uploadedFile: UploadedFile,
  ): Promise<void> {
    const oldUploadedFile = credential.getUploadedFile(uploadedFile);
    if (oldUploadedFile) {
      return this.removeFile(oldUploadedFile);
    }
  }

  async removeFile(uploadedFile: UploadedFile): Promise<void> {
    const filePath = path.resolve(this.storagePath, uploadedFile.id);
    return unlink(filePath);
  }

  async getCredential(
    userId: string,
    token: string,
  ): Promise<null | Credential> {
    const key = `${token}:${userId}`;
    const rawData = await this.redisService.client.GET(key);
    if (!rawData) {
      return null;
    }
    return new Credential(JSON.parse(rawData));
  }

  /* Save credential into redis database */
  async storeCredential(credential: Credential): Promise<string | null> {
    const redisKey = `${credential.id}:${credential.allowed_user}`;
    return this.redisService.client.SET(redisKey, JSON.stringify(credential));
  }

  /* Generate a new upload credential */
  async getToken(
    data: FILE_MANAGER_SERVICE_DTO.GetTokenRequestDTO,
  ): Promise<FILE_MANAGER_SERVICE_DTO.GetTokenResponseDTO> {
    const credential = Credential.fromTokenRequest(data);
    await this.storeCredential(credential);
    await this.tokenService.addCredential(credential);
    return {id: credential.id, expire_at: credential.expire_time};
  }

  /* Get uploaded file */
  getUploadedFile(request: Request): UploadedFile {
    const uploadedFile = request.file;
    if (!uploadedFile) {
      throw new HttpErrors.UnprocessableEntity('Empty file');
    }
    return {
      id: uploadedFile.filename,
      fieldname: uploadedFile.fieldname,
      mimetype: uploadedFile.mimetype,
      originalname: uploadedFile.originalname,
      size: uploadedFile.size,
    };
  }

  constructor(
    @inject(STORAGE_DIRECTORY) private storagePath: string,
    @inject(CREDENTIAL_MANAGER_SERVICE)
    private tokenService: CredentialManagerService,
    @inject(REDIS_SERVICE) private redisService: RedisService,
  ) {}
}

export const FILE_MANAGER_SERVICE = BindingKey.create<FileManagerService>(
  'services.FileManagerService',
);
