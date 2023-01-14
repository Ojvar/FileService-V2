/* eslint-disable @typescript-eslint/naming-convention */
import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors, Model, Request} from '@loopback/rest';
import {ObjectId} from 'bson';
import {FileInfoDTO, FileInfoListDTO, FILE_MANAGER_SERVICE_DTO} from '../dto';
import {
  Credential,
  File,
  FileMeta,
  FileMetaArray,
  Files,
  UploadedFile,
} from '../models';
import {
  CredentialManagerService,
  CREDENTIAL_MANAGER_SERVICE,
} from './credential.manager.service';
import {FileStorageService, FILE_STORAGE_SERVICE} from './file-storage.service';
import {FileService, FILE_SERVICE} from './file.service';
import {RedisService, REDIS_SERVICE} from './redis.service';

export const FILE_MANAGER_SERVICE = BindingKey.create<FileManagerService>(
  'services.FileManagerService',
);

export class FileAccessToken extends Model {
  token: string;
  user_id: string;
  file_id: string;
  expire_time: number;

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

@injectable({scope: BindingScope.APPLICATION})
export class FileManagerService {
  constructor(
    @inject(REDIS_SERVICE) private redisService: RedisService,
    @inject(FILE_SERVICE) private fileService: FileService,
    @inject(FILE_STORAGE_SERVICE)
    private fileStorageService: FileStorageService,
    @inject(CREDENTIAL_MANAGER_SERVICE)
    private credentialManagerService: CredentialManagerService,
  ) {}

  async editFile(
    fileId: string,
    body: FILE_MANAGER_SERVICE_DTO.EditFileDTO,
    userId: string,
  ): Promise<void> {
    /* Load token */
    //TODO: CHECK CREDENTIAL
    const credential = await this.getCredential(body.token_id, userId);
    console.log(credential);

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
    const searchResult: Files = await this.fileStorageService.filterByMetadata(
      metadata,
    );
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
    expireTime = 120,
  ): Promise<FileAccessToken> {
    const accessToken = new FileAccessToken({
      expire_time: expireTime,
      file_id: fileId,
      user_id: userId,
    });

    await this.redisService.client.SET(
      accessToken.redisKey,
      accessToken.toJson(),
      {EX: accessToken.expire_time},
    );

    return accessToken;
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

    /* Remove credential from redis */
    credential.markAsRejected();
    await this.credentialManagerService.removeCredential(credential, true);
  }

  async commit(token: string, userId: string): Promise<File[]> {
    const credential = await this.getCredential(token, userId);
    const files = await this.fileStorageService.saveCredential(credential);

    /* Remove credential from redis */
    credential.markAsCommited();
    await this.credentialManagerService.removeCredential(credential, false);

    return files;
  }

  async pruneExpiredCredentials() {
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
        x => x.field === uploadedFile.fieldname,
      )?.is_private;
      uploadedFile.owner = userId;
    } catch (err) {
      this.fileService.deleteFile(uploadedFile.id);
      throw err;
    }

    /* Replace new-file with old-file */
    await this.deleteFileIfAlreadyUploaded(credential, uploadedFile);
    credential.addOrReplaceUploadedItem(uploadedFile);

    /* Update redis */
    await this.storeCredential(credential);

    return uploadedFile;
  }

  async deleteFileIfAlreadyUploaded(
    credential: Credential,
    uploadedFile: UploadedFile,
  ): Promise<void> {
    const oldUploadedFile = credential.getUploadedFile(uploadedFile);
    if (oldUploadedFile) {
      return this.fileService.deleteFile(oldUploadedFile.id);
    }
  }

  async removeFile(id: string): Promise<void> {
    await this.fileStorageService.removeFile(id);
    return this.fileService.deleteFile(id);
  }

  /* Save credential into redis database */
  async storeCredential(credential: Credential): Promise<string | null> {
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
    const uploadedFile = request.file;
    if (!uploadedFile) {
      throw new HttpErrors.UnprocessableEntity('Empty file');
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
