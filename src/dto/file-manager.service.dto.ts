import {model, property} from '@loopback/repository';
import {ExpireTime} from '../types';

export namespace FILE_MANAGER_SERVICE_DTO {
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
      jsonSchema: {description: 'Mime type'},
    })
    mime_type?: string | null;
  }
  export type AllowedFiles = AllowedFile[];

  @model({jsonSchema: {description: 'Get token request'}})
  export class GetTokenRequestDTO {
    @property.array(AllowedFile, {require: true}) allowed_files: AllowedFiles;
    @property({
      type: 'number',
      required: false,
      jsonSchema: {description: 'Token expire time', type: 'number'},
    })
    expire_time: ExpireTime;

    @property({
      type: 'string',
      requird: true,
      mongodb: {dataType: 'ObjectId'},
      jsonSchema: {description: 'Allowed user id'},
    })
    allowed_user: string;
  }

  @model({jsonSchema: {description: 'Get token response'}})
  export class GetTokenResponseDTO {
    @property({
      type: 'string',
      mongodb: {dataType: 'ObjectId'},
      jsonSchema: {description: 'Token id'},
    })
    id: string;

    @property({type: 'date', jsonSchema: {description: 'Expire time'}})
    expire_at?: ExpireTime;
  }
}
