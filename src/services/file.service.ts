import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {renameSync, unlinkSync} from 'fs';
import {resolve} from 'path';
import {FileHandlerInterceptor} from '../interceptors';

@injectable({scope: BindingScope.APPLICATION})
export class FileService {
  static BINDING_KEY = BindingKey.create<FileService>(
    `services.${FileService.name}`,
  );

  constructor(
    @inject(FileHandlerInterceptor.STORAGE_DIRECTORY)
    private storagePath: string,
  ) {}

  moveFile(source: string, target: string) {
    const sourcePath = resolve(this.storagePath, source);
    const targetPath = resolve(this.storagePath, target);
    renameSync(sourcePath, targetPath);
  }

  deleteFile(id: string) {
    const filePath = resolve(this.storagePath, id);
    unlinkSync(filePath);
  }
}
