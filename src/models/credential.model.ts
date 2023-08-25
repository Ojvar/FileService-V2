/* eslint-disable @typescript-eslint/naming-convention */
import {HttpErrors} from '@loopback/rest';
import {ObjectId} from 'bson';
import {FILE_MANAGER_SERVICE_DTO} from '../dto';
import {StringArray} from '../types';
import {
  Credential as BaseCredential,
  EnumTokenStatus,
  UploadedFile,
} from '../lib-models/src';
import {FileMeta} from './file.model';

export {
  UploadedFiles,
  UploadedFile,
  AllowedFile,
  AllowedFiles,
  EnumTokenStatus,
} from '../lib-models/src';

export class Credential extends BaseCredential {
  constructor(data?: Partial<Credential>) {
    super(data);

    /* Set default data */
    this.id = this.id ?? new ObjectId();
    this.created_at = this.created_at ?? new Date();
    this.allowed_files = this.allowed_files ?? [];
    this.status = this.status ?? EnumTokenStatus.NORMAL;
    this.uploaded_files = this.uploaded_files ?? [];
  }

  setMetadata(field: string, meta?: FileMeta): UploadedFile {
    const uploadedFile = this.uploaded_files.find(x => x.fieldname === field);
    if (!uploadedFile) {
      throw new HttpErrors.UnprocessableEntity('Invalid field');
    }
    uploadedFile.meta = meta;
    return uploadedFile;
  }

  updateMetadata(
    fileId: string,
    appendedFields: FileMeta,
    removedFields: StringArray,
  ): UploadedFile {
    const uploadedFile = this.uploaded_files.find(x => x.id === fileId);
    if (!uploadedFile) {
      throw new HttpErrors.UnprocessableEntity('Invalid uploaded file id');
    }

    if (uploadedFile.meta) {
      removedFields.forEach((field: string) => {
        if (uploadedFile.meta?.[field]) {
          delete uploadedFile.meta[field];
        }
      });
    } else {
      uploadedFile.meta = {};
    }

    const keys = Object.keys(appendedFields);
    keys.forEach((key: string) => {
      if (uploadedFile.meta) {
        uploadedFile.meta[key] = appendedFields[key];
      }
    });

    return uploadedFile;
  }

  markAsCommited() {
    this.status = EnumTokenStatus.COMMITED;
  }
  markAsRejected() {
    this.status = EnumTokenStatus.REJECTED;
  }

  static fromJsonString(data: string): Credential {
    return new Credential(JSON.parse(data));
  }
  toJsonString(): string {
    return JSON.stringify(this);
  }

  getKey(): string {
    return Credential.generateKey(this.id, this.allowed_user);
  }

  isValid(): Boolean {
    /* TODO: CHECK TOKEN STATUS TOO */
    return (
      this.expire_time >= +new Date() && this.status === EnumTokenStatus.NORMAL
    );
  }
  checkAllowedFile(file: UploadedFile): boolean {
    const index = this.allowed_files.findIndex(
      x => x.field === file.fieldname && x.max_size >= file.size,
    );
    return index > -1;
  }
  getUploadedFile(file: UploadedFile): UploadedFile | undefined {
    return this.uploaded_files.find(x => x.fieldname === file.fieldname);
  }

  addOrReplaceUploadedItem(newUploadedFile: UploadedFile): number {
    let index = this.uploaded_files.findIndex(
      x => x.fieldname === newUploadedFile.fieldname,
    );
    if (index !== -1) {
      this.uploaded_files[index] = newUploadedFile;
    } else {
      index = this.uploaded_files.push(newUploadedFile) - 1;
    }
    return index;
  }

  static generateKey(token: string, userId: string): string {
    return `${token}:${userId}`;
  }

  static fromTokenRequest(data: FILE_MANAGER_SERVICE_DTO.GetTokenRequestDTO) {
    return new Credential({
      // uploaded_files: [],
      allowed_files: [...data.allowed_files],
      allowed_user: data.allowed_user,
      expire_time: data.expire_time
        ? +new Date() + data.expire_time * 1000
        : undefined,
    });
  }
}

export interface TokenRelations {}
export type TokenWithRelations = Credential & TokenRelations;
