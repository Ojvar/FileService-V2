import {Model, model, property} from '@loopback/repository';
import {ObjectId} from 'bson';
import {ExpireTime} from '../types';

export enum EnumTokenStatus {
  NORMAL = 0,
  COMMITED = 1,
  REJECTED = 2,
}

@model()
export class Token extends Model {
  @property({type: 'string', id: true, generated: false, required: true})
  id: string;
  @property({type: 'string', required: true}) allowed_user: string;
  @property({type: 'array', itemType: 'object', required: true})
  allowed_files: object[];
  @property({
    type: 'number',
    required: false,
    jsonSchema: {description: 'Token expire time', type: 'number'},
  })
  expire_time?: ExpireTime;
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

  constructor(data?: Partial<Token>) {
    super(data);

    /* Set default data */
    this.id = this.id ?? new ObjectId();
    this.created_at = this.created_at ?? new Date();
    this.allowed_files = this.allowed_files ?? [];
    this.status = this.status ?? EnumTokenStatus.NORMAL;
  }
}

export interface TokenRelations {
  // describe navigational properties here
}

export type TokenWithRelations = Token & TokenRelations;
