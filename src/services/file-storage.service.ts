import {
  BindingKey,
  /* inject, */ BindingScope,
  injectable,
} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
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
      const newFile = await this.fileRepository.addFile(
        file,
        credential.allowed_user,
      );
      files.push(newFile);
    }

    return files;
  }

  constructor(
    @repository(FileRepository) private fileRepository: FileRepository,
  ) {}
}
