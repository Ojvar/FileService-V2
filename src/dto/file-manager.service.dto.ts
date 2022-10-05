import {model, property} from '@loopback/repository';
import {AllowedFile, AllowedFiles} from '../models';

export namespace FILE_MANAGER_SERVICE_DTO {
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
    expire_at: number;
  }
}
