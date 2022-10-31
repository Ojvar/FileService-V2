import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {FileInfoDTO, FILE_MANAGER_SERVICE_DTO} from '../dto';
import {Credential, File, UploadedFile} from '../models';
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

@injectable({scope: BindingScope.APPLICATION})
export class FileManagerService {
  async getFileInfo(id: string): Promise<FileInfoDTO> {
    const file = await this.fileStorageService.getFileById(id);
    return FileInfoDTO.fromModel(file);
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
      throw new HttpErrors.UnprocessableEntity('Invalid token');
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
  async getToken(
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
    };
  }

  constructor(
    @inject(REDIS_SERVICE) private redisService: RedisService,
    @inject(FILE_SERVICE) private fileService: FileService,
    @inject(FILE_STORAGE_SERVICE)
    private fileStorageService: FileStorageService,
    @inject(CREDENTIAL_MANAGER_SERVICE)
    private credentialManagerService: CredentialManagerService,
  ) {}
}
