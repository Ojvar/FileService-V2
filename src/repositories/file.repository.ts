/* eslint-disable @typescript-eslint/naming-convention */
import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {FileStorageDataSource, FILE_STORAGE_DATASOURCE} from '../datasources';
import {EnumFileStatus, File, FileRelations, UploadedFile} from '../models';

export class FileRepository extends DefaultCrudRepository<
  File,
  typeof File.prototype.id,
  FileRelations
> {
  async getFileInfo(id: string): Promise<File> {
    const file = await this.findById(id);
    if (!file?.isValid()) {
      throw new HttpErrors.UnprocessableEntity('File not found');
    }
    return file;
  }

  fileFromUploadedFile(file: UploadedFile, userId: string): File {
    const now = new Date();
    return new File({
      id: file.id,
      field_name: file.fieldname,
      original_name: file.originalname,
      mime: file.mimetype,
      size: file.size,
      status: EnumFileStatus.ACTIVE,
      uploaded: {at: now, by: userId},
      meta: file.meta,
      is_private: file.is_private,
      owner: file.owner,
    });
  }

  async addFile(file: UploadedFile, userId: string): Promise<File> {
    const newFile = this.fileFromUploadedFile(file, userId);
    return this.create(newFile);
  }

  async updateFile(file: UploadedFile, userId: string): Promise<File> {
    const newFile = this.fileFromUploadedFile(file, userId);
    await this.updateById(newFile.id, newFile);
    return newFile;
  }

  constructor(
    @inject(FILE_STORAGE_DATASOURCE) dataSource: FileStorageDataSource,
  ) {
    super(File, dataSource);
  }
}
