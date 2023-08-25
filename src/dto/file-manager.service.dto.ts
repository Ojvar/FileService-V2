/* eslint-disable @typescript-eslint/naming-convention */
import {model, property} from '@loopback/repository';
import {AllowedFile, AllowedFiles, FileMeta} from '../models';
import {StringArray} from '../types';

export const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/.source;

export namespace FILE_MANAGER_SERVICE_DTO {
  @model()
  export class GetFileInfoRequestDTO {
    @property.array(String, {
      description: "File id's list",
      jsonSchema: {pattern: OBJECT_ID_PATTERN},
    })
    files: string[];
  }

  @model()
  export class SearchMetadataDTO {
    @property({
      type: 'object',
      required: true,
      jsonSchema: {description: 'Fields to search'},
    })
    fields: FileMeta;
  }

  @model()
  export class UpdateMetadataDTO {
    @property({type: 'object', required: false, default: {}})
    appended_fields: FileMeta;
    @property.array(String, {required: false, default: []})
    removed_fileds: StringArray;
  }

  @model()
  export class EditFileDTO {
    @property({type: 'string'}) token_id: string;
    // @property() meta?: FileMeta;
  }

  @model({jsonSchema: {description: 'Get token request'}})
  export class GetTokenRequestDTO {
    @property.array(AllowedFile, {require: true}) allowed_files: AllowedFiles;
    @property({
      type: 'number',
      required: true,
      jsonSchema: {
        description: 'Token expire time in seconds',
        type: 'number',
        minimum: 30,
        maximum: 3600,
      },
    })
    expire_time: number;

    @property({
      type: 'string',
      requird: true,
      jsonSchema: {description: 'Allowed user id'},
    })
    allowed_user: string;
  }

  @model({jsonSchema: {description: 'Get token response'}})
  export class GetTokenResponseDTO {
    @property({
      type: 'string',
      // mongodb: {dataType: 'ObjectId'},
      jsonSchema: {description: 'Token id'},
    })
    id: string;

    @property({type: 'date', jsonSchema: {description: 'Expire time'}})
    expire_at: number;
  }
}
