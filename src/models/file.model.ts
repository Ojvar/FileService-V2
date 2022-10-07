import {Entity, model, property} from '@loopback/repository';

export enum EnumFileStatus {
  ACTIVE = 0,
  DELETED = 1,
}

@model()
export class UploadData {
  @property({type: 'date', required: true}) at: Date;
  @property({type: 'string', required: true, mongodb: {dataType: 'ObjectId'}})
  by: string;
}

@model({name: 'files'})
export class File extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
  })
  id: string;
  @property({type: 'string', required: true}) filename: string;
  @property({type: 'string', required: true}) original_name: string;
  @property({type: 'number', required: true}) size: number;
  @property({type: 'string', required: true}) mime: string;
  @property({required: true}) uploaded: UploadData;
  @property({
    type: 'number',
    required: true,
    jsonSchema: {type: 'number', enum: Object.values(EnumFileStatus)},
  })
  status: EnumFileStatus;

  constructor(data?: Partial<File>) {
    super(data);
    this.status = data?.status ?? EnumFileStatus.ACTIVE;
  }
}

export interface FileRelations {
  // describe navigational properties here
}

export type FileWithRelations = File & FileRelations;
