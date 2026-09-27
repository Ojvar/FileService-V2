/* eslint-disable @typescript-eslint/naming-convention */
import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {FILE_MANAGER_SERVICE_DTO, FileInfoDTO, FileInfoListDTO} from '../dto';
import {RedisService} from '../lib-redis/src';
import {
  Credential,
  File,
  FileAccessToken,
  FileMeta,
  FileMetaArray,
  Files,
  UploadedFile,
} from '../models';
import {CredentialManagerService} from './credential.manager.service';
import {FileStorageService} from './file-storage.service';
import {FileService} from './file.service';
import {AnyObject} from '@loopback/repository';

export type FileManagerServiceConfig = {
  accessTokenExpireTime: number;
};

const FILE_ACCESS_TOKEN_TTL_SECONDS = 1800;

@injectable({scope: BindingScope.APPLICATION})
export class FileManagerService {
  static BINDING_KEY = BindingKey.create<FileManagerService>(
    `services.${FileManagerService.name}`,
  );
  static CONFIG_BINDING_KEY = BindingKey.create<FileManagerServiceConfig>(
    `services.config.${FileManagerService.name}`,
  );

  constructor(
    @inject(FileManagerService.CONFIG_BINDING_KEY)
    private configs: FileManagerServiceConfig,
    @inject(RedisService.BINDING_KEY) private redisService: RedisService,
    @inject(FileService.BINDING_KEY) private fileService: FileService,
    @inject(FileStorageService.BINDING_KEY)
    private fileStorageService: FileStorageService,
    @inject(CredentialManagerService.BINDING_KEY)
    private credentialManagerService: CredentialManagerService,
  ) {}

  async editFile(
    fileId: string,
    body: FILE_MANAGER_SERVICE_DTO.EditFileDTO,
    userId: string,
  ): Promise<void> {
    /* Load token */
    const credential = await this.getCredential(body.token_id, userId);

    /* Load file */
    const file = await this.fileStorageService.getFileById(fileId);
    credential.setMetadata(file.field_name, file.meta);
    await this.storeCredential(credential);

    /* Commit token */
    await this.commit(body.token_id, userId);
  }

  async certificateEditMetadata(
    token: string,
    userId: string,
    fileId: string,
    data: FILE_MANAGER_SERVICE_DTO.UpdateMetadataDTO,
  ): Promise<UploadedFile> {
    const credential = await this.getCredential(token, userId);
    const uploadedFile = credential.updateMetadata(
      fileId,
      data.appended_fields,
      data.removed_fileds,
    );
    await this.storeCredential(credential);
    return uploadedFile;
  }

  async searchMetadataAdvance(
    metadata: FileMetaArray,
    userId: string,
  ): Promise<FileInfoListDTO> {
    const searchResult: Files =
      await this.fileStorageService.filterByMetadataAdvance(metadata);
    const result: FileInfoListDTO = [];
    for (const file of searchResult) {
      const token = await this.generateAccessToken(file.getId(), userId);
      result.push(FileInfoDTO.fromModel(file, token));
    }
    return result;
  }

  async searchMetadata(
    metadata: FileMeta,
    userId: string,
  ): Promise<FileInfoListDTO> {
    const searchResult: Files =
      await this.fileStorageService.filterByMetadata(metadata);
    const result: FileInfoListDTO = [];
    for (const file of searchResult) {
      const token = await this.generateAccessToken(file.getId(), userId);
      result.push(FileInfoDTO.fromModel(file, token));
    }
    return result;
  }

  async updateMetadata(
    id: string,
    data: FILE_MANAGER_SERVICE_DTO.UpdateMetadataDTO,
  ): Promise<void> {
    const file = await this.fileStorageService.getFileById(id);
    file.updateMetadata(data.appended_fields, data.removed_fileds);
    return this.fileStorageService.updateFile(file);
  }

  async generateAccessToken(
    fileId: string,
    userId: string,
    expireTime?: number,
  ): Promise<FileAccessToken> {
    const ttlSeconds = this.resolveAccessTokenTtl(expireTime);
    const accessToken = new FileAccessToken({
      expire_time: ttlSeconds,
      file_id: fileId,
      user_id: userId,
    });
    await this.redisService.client.SET(
      accessToken.redisKey,
      accessToken.toJson(),
      {EX: ttlSeconds},
    );
    return accessToken;
  }

  private resolveAccessTokenTtl(expireTime?: number): number {
    const configuredTtl = expireTime ?? this.configs.accessTokenExpireTime;
    if (!Number.isFinite(configuredTtl) || configuredTtl <= 0) {
      return FILE_ACCESS_TOKEN_TTL_SECONDS;
    }
    return Math.floor(configuredTtl);
  }

  async checkAccessToken(fileId: string, token: string): Promise<boolean> {
    const redisKey = FileAccessToken.getRedisKey(token);
    const rawAccessToken = await this.redisService.client.GET(redisKey);
    if (!rawAccessToken) {
      throw new HttpErrors.UnprocessableEntity('Invalid token');
    }
    const accessToken = JSON.parse(rawAccessToken) as FileAccessToken;
    if (accessToken.file_id !== fileId) {
      throw new HttpErrors.Forbidden('Access denined');
    }
    return true;
  }

  async getFilesInfo(
    fileIds: string[],
    userId: string,
  ): Promise<FileInfoListDTO> {
    if (fileIds.length === 0) {
      return [];
    }
    const files = await this.fileStorageService.getFilesList(fileIds);
    const accessTokens = [];
    for (const file of files) {
      accessTokens.push({
        file,
        token: userId
          ? await this.generateAccessToken(file.getId(), userId)
          : null,
      });
    }
    return accessTokens.map(file =>
      FileInfoDTO.fromModel(file.file, file.token),
    );
  }
  async getFileInfo(id: string, userId: string): Promise<FileInfoDTO> {
    const file = await this.fileStorageService.getFileById(id);
    const accessToken = userId
      ? await this.generateAccessToken(id, userId)
      : null;
    return FileInfoDTO.fromModel(file, accessToken);
  }

  async getCredential(token: string, userId: string): Promise<Credential> {
    const rawCredential = await this.redisService.client.GET(
      Credential.generateKey(token, userId),
    );
    if (!rawCredential) {
      throw new HttpErrors.UnprocessableEntity('Invalid token');
    }
    const credential = Credential.fromJsonString(rawCredential);
    if (!credential.isValid()) {
      throw new HttpErrors.UnprocessableEntity('Invalid certificate');
    }
    return credential;
  }

  async reject(token: string, userId: string) {
    const credential = await this.getCredential(token, userId);
    credential.markAsRejected();
    await this.credentialManagerService.removeCredential(credential, true);
  }

  async commit(token: string, userId: string): Promise<File[]> {
    const credential = await this.getCredential(token, userId);
    const files = await this.fileStorageService.saveCredential(credential);
    credential.markAsCommited();
    await this.credentialManagerService.removeCredential(credential, false);
    return files;
  }

  pruneExpiredCredentials() {
    return this.credentialManagerService.pruneLastExpiredEntry();
  }

  async uploadFile(
    userId: string,
    token: string,
    field: string,
    request: Request,
  ): Promise<UploadedFile> {
    /* Fix field-name, it is 'file' as default */
    const uploadedFile = this.getUploadedFile(request, field);
    uploadedFile.originalname = Buffer.from(
      uploadedFile.originalname,
      'latin1',
    ).toString('utf8');

    /* Fetch and Validate credential */
    let credential;
    try {
      credential = await this.getCredential(token, userId);
      if (!credential.checkAllowedFile(uploadedFile)) {
        throw new HttpErrors.UnprocessableEntity(
          'Invalid field-name or file-size',
        );
      }

      /* Set is_private field */
      uploadedFile.is_private = credential.allowed_files.find(
        (x: AnyObject) => x.field === uploadedFile.fieldname,
      )?.is_private;
      uploadedFile.owner = userId;
      uploadedFile.meta = JSON.parse(request?.body['meta'] ?? '{}');
    } catch (err) {
      this.fileService.deleteFile(uploadedFile.id);
      throw err;
    }

    /* Replace new-file with old-file */
    this.deleteFileIfAlreadyUploaded(credential, uploadedFile);
    credential.addOrReplaceUploadedItem(uploadedFile);

    /* Update redis */
    await this.storeCredential(credential);

    return uploadedFile;
  }

  deleteFileIfAlreadyUploaded(
    credential: Credential,
    uploadedFile: UploadedFile,
  ): void {
    const oldUploadedFile = credential.getUploadedFile(uploadedFile);
    if (oldUploadedFile) {
      this.fileService.deleteFile(oldUploadedFile.id);
    }
  }

  async removeFile(id: string): Promise<void> {
    await this.fileStorageService.removeFile(id);
    return this.fileService.deleteFile(id);
  }

  /* Save credential into redis database */
  storeCredential(credential: Credential): Promise<string | null> {
    return this.redisService.client.SET(
      credential.getKey(),
      credential.toJsonString(),
    );
  }

  /* Generate a new upload credential */
  async generateCertificate(
    data: FILE_MANAGER_SERVICE_DTO.GetTokenRequestDTO,
  ): Promise<FILE_MANAGER_SERVICE_DTO.GetTokenResponseDTO> {
    const credential = Credential.fromTokenRequest(data);
    await this.storeCredential(credential);
    await this.credentialManagerService.addCredential(credential);
    return {id: credential.id, expire_at: credential.expire_time};
  }

  /* Get uploaded file */
  getUploadedFile(request: Request, field?: string): UploadedFile {
    const files = (request.files ?? []) as Express.Multer.File[];
    const uploadedFile = files.find(
      f => f.fieldname === 'file' || f.fieldname === field,
    );
    if (!uploadedFile) {
      throw new HttpErrors.UnprocessableEntity(
        'Empty file or Invalid file size',
      );
    }
    return {
      id: uploadedFile.filename,
      fieldname: field ?? uploadedFile.fieldname,
      mimetype: uploadedFile.mimetype,
      originalname: uploadedFile.originalname,
      size: uploadedFile.size,
      meta: request.body,
      owner: '',
    };
  }
}
