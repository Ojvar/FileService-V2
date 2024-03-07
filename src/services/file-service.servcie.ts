import {
  BindingScope,
  ContextTags,
  inject,
  injectable,
  Provider,
} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {FileServiceDataSource} from '../datasources';
import {PROFILE_DTO} from '../dto';
import {COMMON_KEYS} from '../keys';
import {FILE_SERVICE_TYPES} from '../types';

export interface FileService {
  getToken(token: string, ref: string, allowedFiles: string[]): Promise<string>;
  filesList(
    token: string,
    ref: string,
    fileToken: string,
  ): Promise<FILE_SERVICE_TYPES.FileItem>;
  filesInfo(
    token: string,
    fileIds: string[],
  ): Promise<PROFILE_DTO.FilesListResult>;
  save(token: string, ref: string, fileToken: string): Promise<void>;
  commit(token: string, ref: string, fileToken: string): Promise<void>;
}

@injectable({
  scope: BindingScope.SINGLETON,
  tags: {
    [ContextTags.NAME]: 'FileService',
    [ContextTags.NAMESPACE]: 'services',
  },
})
export class FileServiceProvider implements Provider<FileService> {
  constructor(
    // FileService must match the name property in the datasource json file
    @inject(COMMON_KEYS.FILE_SERVICE_DATASOURCE)
    protected dataSource: FileServiceDataSource = new FileServiceDataSource(),
  ) {}

  value(): Promise<FileService> {
    return getService(this.dataSource);
  }
}
