import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {renameSync, unlinkSync} from 'fs';
import {resolve} from 'path';
import {STORAGE_DIRECTORY} from '../interceptors';

export const FILE_SERVICE = BindingKey.create<FileService>(
  'services.FileService',
);

@injectable({scope: BindingScope.TRANSIENT})
export class FileService {
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

  deleteFile(id: string) {
    const filePath = resolve(this.storagePath, id);
    try {
      unlinkSync(filePath);
    } catch (err) {
      /* TODO: LOG ERROR */
      console.error(err);
    }
  }

  constructor(@inject(STORAGE_DIRECTORY) private storagePath: string) {}
}
