/* eslint-disable @typescript-eslint/naming-convention */
import {Model, model, property} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {ObjectId} from 'bson';
import {FILE_MANAGER_SERVICE_DTO} from '../dto';
import {StringArray} from '../types';
import {FileMeta} from './file.model';

export enum EnumTokenStatus {
  NORMAL = 0,
  COMMITED = 1,
  REJECTED = 2,
}

@model({jsonSchema: {description: 'Allowed file item'}})
export class AllowedFile {
  @property({
    type: 'string',
    required: true,
    jsonSchema: {description: 'Field name', minLength: 1, maxLength: 50},
  })
  field: string;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {description: 'Maximum file size in bytes', minimum: 1},
  })
  max_size: number;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {description: 'MIME type'},
  })
  mime_type?: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {description: 'File id to replace with'},
  })
  replace_with?: string;

  @property({
    type: 'boolean',
    required: true,
    jsonSchema: {description: 'Set Access level to private'},
  })
  is_private: boolean;
}
export type AllowedFiles = AllowedFile[];

@model()
export class UploadedFile {
  @property({
    type: 'string',
    required: true,
    jsonSchema: {description: 'File id'},
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {description: 'File fieldname'},
  })
  fieldname: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {description: 'File mimetype'},
  })
  mimetype: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {description: 'File originalname'},
  })
  originalname: string;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {description: 'File size'},
  })
  size: number;

  @property({
    type: 'object',
    required: false,
    default: {},
    jsonSchema: {
      description: 'File meta data',
      additionalProperties: {type: ['string', 'number']},
    },
  })
  meta?: FileMeta;

  @property({
    type: 'boolean',
    required: true,
    jsonSchema: {description: 'Set file access level'},
  })
  is_private?: boolean;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {description: 'File owner'},
  })
  owner: string;
}
export type UploadedFiles = UploadedFile[];

@model()
export class Credential extends Model {
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

  constructor(data?: Partial<Credential>) {
    super(data);

    /* Set default data */
    this.id = this.id ?? new ObjectId();
    this.created_at = this.created_at ?? new Date();
    this.allowed_files = this.allowed_files ?? [];
    this.status = this.status ?? EnumTokenStatus.NORMAL;
    this.uploaded_files = this.uploaded_files ?? [];
  }

  @property({type: 'string', id: true, generated: false, required: true})
  id: string;
  @property({type: 'string', required: true}) allowed_user: string;

  @property.array(AllowedFile, {
    required: true,
    jsonSchema: {description: 'Allowed files list'},
  })
  allowed_files: AllowedFiles;

  @property.array(UploadedFile, {
    required: false,
    default: [],
    jsonSchema: {description: 'Uploaded files list'},
  })
  uploaded_files: UploadedFiles;

  @property({
    type: 'number',
    jsonSchema: {description: 'Token expire time', type: 'number'},
  })
  expire_time: number;

  @property({type: 'date', required: true}) created_at: string;
  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      description: 'Token status',
      type: 'number',
      enum: Object.values(EnumTokenStatus),
    },
  })
  status: EnumTokenStatus;
}

export interface TokenRelations {
  // describe navigational properties here
}

export type TokenWithRelations = Credential & TokenRelations;
