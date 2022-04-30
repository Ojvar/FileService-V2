/* eslint-disable @typescript-eslint/naming-convention */
import {Model, model, property} from '@loopback/repository';

@model()
export class RequestToken extends Model {
  @property({type: 'string', required: true}) key: string;
  @property({type: 'string', required: true}) ref: string;
  @property({type: 'string', required: true}) user_id: string;
  @property({type: 'date', required: true}) created_at: Date;
  @property({type: 'array', required: true}) allowed_files: string[];
  @property({type: 'boolean', default: false}) commited?: boolean;
  @property({
    type: 'object',
    required: false,
    default: {},
    jsonSchema: {
      additionalProperties: {
        type: 'object',
      },
    },
  })
  uploaded_files: Record<string, string>;

  constructor(data: Partial<RequestToken>) {
    super(data);
  }

  public toString = (): string => JSON.stringify(this);

  static toJSON(dataStr: string): RequestToken {
    return JSON.parse(dataStr);
  }
}

export interface RequestTokenRelations {
  // describe navigational properties here
}

export type RequestTokenWithRelations = RequestToken & RequestTokenRelations;
