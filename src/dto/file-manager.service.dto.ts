/* eslint-disable @typescript-eslint/naming-convention */
import {model, property} from '@loopback/repository';
import {AllowedFile, AllowedFiles, FileMeta} from '../models';
import {StringArray} from '../types';

export const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/.source;

export namespace FILE_MANAGER_SERVICE_DTO {
  @model()
  export class UpdateMetadataDTO {
    @property({type: 'object', required: false, default: {}})
    appended_fields: FileMeta;
    @property.array(String, {required: false, default: []})
    removed_fileds: StringArray;
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
      // id: true,
      // mongodb: {dataType: 'ObjectId'},
      jsonSchema: {
        description: 'Allowed user id',
        // pattern: OBJECT_ID_PATTERN,
      },
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
