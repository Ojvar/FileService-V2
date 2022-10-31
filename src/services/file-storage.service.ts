import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {STORAGE_DIRECTORY} from '../interceptors';
import {Credential, File} from '../models';
import {FileRepository} from '../repositories';
import {FileService, FILE_SERVICE} from './file.service';

export const FILE_STORAGE_SERVICE = BindingKey.create<FileStorageService>(
  'services.FileStorageService',
);

@injectable({scope: BindingScope.TRANSIENT})
export class FileStorageService {
  async removeFile(id: string): Promise<void> {
    return this.fileRepository.deleteById(id);
  }

  async getFileById(id: string): Promise<File> {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new HttpErrors.UnprocessableEntity('Invalid file id');
    }
    return file;
  }

  /* Save all uploaded files into database */
  async saveCredential(credential: Credential) {
    const files: File[] = [];
    for (const file of credential.uploaded_files) {
      /* Check for replace_with field */
      const allowedFileInfo = credential.allowed_files.find(
        x => x.field === file.fieldname,
      );

      if (allowedFileInfo?.replace_with) {
        /* Remove old file */
        this.fileService.deleteFile(allowedFileInfo.replace_with);
        /* Rename new file to old file */
        this.fileService.moveFile(file.id, allowedFileInfo.replace_with);
        /* Update file-info */
        file.id = allowedFileInfo.replace_with;
      }

      let newFile;
      if (!allowedFileInfo?.replace_with) {
        newFile = await this.fileRepository.addFile(
          file,
          credential.allowed_user,
        );
      } else {
        newFile = await this.fileRepository.updateFile(
          file,
          credential.allowed_user,
        );
      }
      files.push(newFile);
    }

    return files;
  }

  constructor(
    @inject(STORAGE_DIRECTORY) private storagePath: string,
    @inject(FILE_SERVICE) private fileService: FileService,
    @repository(FileRepository) private fileRepository: FileRepository,
  ) {}
}
