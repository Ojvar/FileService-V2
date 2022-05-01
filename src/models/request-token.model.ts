/* eslint-disable @typescript-eslint/naming-convention */
import {Model, model, property} from '@loopback/repository';

export enum EnumRequestTokenStatus {
  NONE,
  COMMITED,
  DISMISSED,
}

@model()
export class FileData extends Model {
  @property({type: 'string'}) fieldname: string;
  @property({type: 'string'}) originalname: string;
  @property({type: 'string'}) encoding: string;
  @property({type: 'string'}) mimetype: string;
  @property({type: 'number'}) size: number;
  @property({type: 'string'}) destination: string;
  @property({type: 'string'}) filename: string;
  @property({type: 'string'}) path: string;

  constructor(data: Partial<FileData>) {
    super(data);
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }
}

@model()
export class RequestToken extends Model {
  @property({type: 'string', required: true}) key: string;
  @property({type: 'string', required: true}) ref: string;
  @property({type: 'string', required: true}) user_id: string;
  @property({type: 'date', required: true}) created_at: Date;
  @property({type: 'array', required: true}) allowed_files: string[];
  @property({type: 'number', default: EnumRequestTokenStatus.NONE})
  status: EnumRequestTokenStatus;
  @property({
    type: 'object',
    required: false,
    default: {},
    jsonSchema: {additionalProperties: {type: 'object'}},
  })
  uploaded_files: Record<string, FileData>;

  constructor(data: Partial<RequestToken>) {
    super(data);
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  static toJSON(dataStr: string | null | undefined): RequestToken {
    return new RequestToken(JSON.parse(dataStr ?? '{}'));
  }
}

export interface RequestTokenRelations {
  // describe navigational properties here
}

export type RequestTokenWithRelations = RequestToken & RequestTokenRelations;
