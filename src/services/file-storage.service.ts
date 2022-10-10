import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {renameSync, unlinkSync} from 'fs';
import {resolve} from 'path';
import {STORAGE_DIRECTORY} from '../interceptors';
import {Credential, File} from '../models';
import {FileRepository} from '../repositories';

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
        this.deleteFile(allowedFileInfo.replace_with);
        /* Rename new file to old file */
        this.moveFile(file.id, allowedFileInfo.replace_with);
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

  deleteFile(id: string) {
    const filePath = resolve(this.storagePath, id);
    try {
      unlinkSync(filePath);
    } catch (err) {
      /* TODO: LOG ERROR */
      console.error(err);
    }
  }

  moveFile(source: string, target: string) {
    const sourcePath = resolve(this.storagePath, source);
    const targetPath = resolve(this.storagePath, target);
    try {
      renameSync(sourcePath, targetPath);
    } catch (err) {
      /* TODO: LOG ERROR */
      console.error(err);
    }
  }

  constructor(
    @inject(STORAGE_DIRECTORY) private storagePath: string,
    @repository(FileRepository) private fileRepository: FileRepository,
  ) {}
}
