 
import { StringArray } from '../types';

export {
  EnumFileStatus,
  FileMeta,
  FileMetaArray,
  UploadData,
} from '../lib-models/src';
import { File as BaseFile, EnumFileStatus, FileMeta } from '../lib-models/src';

export class File extends BaseFile {
  constructor(data?: Partial<File>) {
    super(data);
    this.status = data?.status ?? EnumFileStatus.ACTIVE;
  }

  isValid(): boolean {
    return this.status === EnumFileStatus.ACTIVE;
  }

  replaceMetadata(meta?: FileMeta) {
    this.meta = meta;
  }

  updateMetadata(appendedFields: FileMeta, deletedFields: StringArray = []) {
    if (this.meta) {
      deletedFields.forEach((field: string) => {
        if (this.meta?.[field]) {
          delete this.meta[field];
        }
      });
    } else {
      this.meta = {};
    }

    const keys = Object.keys(appendedFields);
    keys.forEach((key: string) => {
      if (this.meta) {
        this.meta[key] = appendedFields[key];
      }
    });
  }
}
export type Files = Array<File>;

export interface FileRelations { }
export type FileWithRelations = File & FileRelations;
