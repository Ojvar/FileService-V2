import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {FileStorageDataSource} from '../datasources';
import {EnumFileStatus, File, FileRelations, UploadedFile} from '../models';

export class FileRepository extends DefaultCrudRepository<
  File,
  typeof File.prototype.id,
  FileRelations
> {
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
    });
    return this.create(newFile);
  }

  constructor(
    @inject('datasources.FileStorage') dataSource: FileStorageDataSource,
  ) {
    super(File, dataSource);
  }
}
