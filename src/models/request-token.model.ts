/* eslint-disable @typescript-eslint/naming-convention */
import {Model, model, property} from '@loopback/repository';

@model()
export class RequestToken extends Model {
  @property({type: 'string', generated: false, required: true}) ref: string;
  @property({type: 'string', required: true}) user_id: string;
  @property({type: 'date', required: true}) created_at: Date;
  @property({type: 'array', required: true}) files: string[];
  @property({type: 'boolean', default: false}) commited?: boolean;

  constructor(data: Partial<RequestToken>) {
    super(data);
  }

  public toString = (): string => JSON.stringify(this);
}

export interface RequestTokenRelations {
  // describe navigational properties here
}

export type RequestTokenWithRelations = RequestToken & RequestTokenRelations;
