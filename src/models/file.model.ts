import {Entity, model, property} from '@loopback/repository';
import {TimeStampModel} from './extra-models';

@model()
export class File extends Entity {
  @property({type: 'string', id: true, generated: true}) id?: string;
  @property({type: 'string', required: true}) filename: string;
  @property({type: 'string', required: true}) original_name: string;
  @property({type: 'string', required: true}) mimetype: string;
  @property({type: 'number', required: true}) size: number;
  @property() uploaded: TimeStampModel;

  constructor(data?: Partial<File>) {
    super(data);
  }
}

export interface FileRelations {
  // describe navigational properties here
}

export type FileWithRelations = File & FileRelations;
