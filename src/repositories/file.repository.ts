import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {FileStorageDataSource} from '../datasources';
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

  async addFile(file: UploadedFile, userId: string): Promise<File> {
    const now = new Date();
    const newFile = new File({
      id: file.id,
      field_name: file.fieldname,
      original_name: file.originalname,
      mime: file.mimetype,
      size: file.size,
      status: EnumFileStatus.ACTIVE,
      uploaded: {at: now, by: userId},
      meta: file.meta,
    });
    return this.create(newFile);
  }

  async updateFile(file: UploadedFile, userId: string): Promise<File> {
    const now = new Date();
    const newFile = new File({
      id: file.id,
      field_name: file.fieldname,
      original_name: file.originalname,
      mime: file.mimetype,
      size: file.size,
      status: EnumFileStatus.ACTIVE,
      uploaded: {at: now, by: userId},
      meta: file.meta,
    });

    await this.updateById(newFile.id, newFile);
    return newFile;
  }

  constructor(
    @inject('datasources.FileStorage') dataSource: FileStorageDataSource,
  ) {
    super(File, dataSource);
  }
}
