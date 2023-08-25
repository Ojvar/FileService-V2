/* eslint-disable @typescript-eslint/naming-convention */
import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {ObjectID} from 'bson';
import {Credential, File, FileMeta, FileMetaArray, Files} from '../models';
import {FileRepository} from '../repositories';
import {FileService, FILE_SERVICE} from './file.service';

export const FILE_STORAGE_SERVICE = BindingKey.create<FileStorageService>(
  'services.FileStorageService',
);

@injectable({scope: BindingScope.TRANSIENT})
export class FileStorageService {
  constructor(
    @inject(FILE_SERVICE) private fileService: FileService,
    @repository(FileRepository) private fileRepository: FileRepository,
  ) {}

  async filterByMetadataAdvance(metadata: FileMetaArray): Promise<Files> {
    const filter: object[] = [];
    metadata.forEach(metaItem => {
      const metaItemFilter = Object.keys(metaItem).reduce(
        (result: Record<string, unknown>, key: string) => {
          result[`meta.${key}`] = {$regex: metaItem[key], $options: 'i'};
          return result;
        },
        {},
      );
      filter.push(metaItemFilter);
    });
    return this.fileRepository.find({where: {or: filter}});
  }

  async filterByMetadata(metadata: FileMeta): Promise<Files> {
    const filter = Object.keys(metadata).reduce(
      (result: Record<string, unknown>, key: string) => {
        result[`meta.${key}`] = metadata[key];
        return result;
      },
      {},
    );
    return this.fileRepository.find({where: filter});
  }

  async updateFile(file: File): Promise<void> {
    return this.fileRepository.update(file);
  }

  async removeFile(id: string): Promise<void> {
    return this.fileRepository.deleteById(id);
  }

  async getFilesList(files: string[] = []): Promise<Files> {
    const aggregate = [
      {$match: {_id: {$in: files.map(x => new ObjectID(x))}}},
      {
        $project: {
          _id: 0,
          id: '$_id',
          field_name: 1,
          original_name: 1,
          size: 1,
          mime: 1,
          is_private: 1,
          owner: 1,
          uploaded: 1,
          status: 1,
          meta: 1,
        },
      },
    ];
    const pointer = await this.fileRepository.execute(
      File.modelName,
      'aggregate',
      aggregate,
    );
    const result = (await pointer.toArray()).map((x: object) => new File(x));
    if (!result || result.length === 0) {
      throw new HttpErrors.UnprocessableEntity('Invalid files data');
    }
    return result;
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
}
