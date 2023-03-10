/* eslint-disable @typescript-eslint/naming-convention */
import {Entity, model, property} from '@loopback/repository';
import {StringArray} from '../types';

export enum EnumFileStatus {
  ACTIVE = 0,
  DELETED = 1,
}

export type FileMeta = Record<string, string | number>;
export type FileMetaArray = Array<FileMeta>;

@model()
export class UploadData {
  @property({type: 'date', required: true}) at: Date;
  @property({type: 'string', required: true}) by: string;
}

@model({name: 'files'})
export class File extends Entity {
  @property({type: 'string', id: true, generated: false}) id?: string;
  @property({type: 'string', required: true}) field_name: string;
  @property({type: 'string', required: true}) original_name: string;
  @property({type: 'number', required: true}) size: number;
  @property({type: 'string', required: true}) mime: string;
  @property({type: 'boolean', required: true}) is_private: boolean;
  @property({type: 'string', required: true}) owner: string;
  @property({required: true}) uploaded: UploadData;
  @property({
    type: 'number',
    required: true,
    jsonSchema: {type: 'number', enum: Object.values(EnumFileStatus)},
  })
  status: EnumFileStatus;
  @property({
    type: 'object',
    required: false,
    default: {},
    jsonSchema: {additionalProperties: {type: ['string', 'number']}},
  })
  meta?: FileMeta;

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

export interface FileRelations {
  // describe navigational properties here
}

export type FileWithRelations = File & FileRelations;
export type Files = Array<File>;
