import {inject, LifeCycleObserver, lifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {COMMON_KEYS} from '../keys';
import {COMMON_TYPES} from '../types';
import {AnyObject} from '@loopback/filter/dist/types';

const config = {
  name: 'FileService',
  connector: 'rest',
  // baseURL: 'http://localhost:3000',
  crud: false,
};

const getConfig = (
  data: AnyObject & Partial<COMMON_TYPES.RestDataSourceConfig>,
): object => {
  return {
    ...data,
    operations: [
      {
        template: {
          method: 'POST',
          url: `${data.baseURL}/token`,
          json: true,
          headers: {
            'content-type': 'application/json;charset=utf-8',
            authorization: 'Bearer {token}',
          },
          body: {ref: '{ref}', allowedFiles: '{allowedFiles}'},
        },
        functions: {getToken: ['token', 'ref', 'allowedFiles']},
      },
      {
        template: {
          method: 'GET',
          url: `${data.baseURL}/files-list/{ref}`,
          json: true,
          headers: {
            'content-type': 'application/json;charset=utf-8',
            authorization: 'Bearer {token}',
            'file-token': '{fileToken}',
          },
        },
        functions: {filesList: ['token', 'ref', 'fileToken']},
      },
      {
        template: {
          method: 'POST',
          url: `${data.baseURL}/files-info`,
          json: true,
          headers: {
            'content-type': 'application/json;charset=utf-8',
            authorization: 'Bearer {token}',
          },
          body: '{fileIds}',
        },
        functions: {filesInfo: ['token', 'fileIds']},
      },
      {
        template: {
          method: 'PATCH',
          url: `${data.baseURL}/token/save/{ref}`,
          json: true,
          headers: {
            'content-type': 'application/json;charset=utf-8',
            authorization: 'Bearer {token}',
            'file-token': '{fileToken}',
          },
        },
        functions: {save: ['token', 'ref', 'fileToken']},
      },
      {
        template: {
          method: 'PATCH',
          url: `${data.baseURL}/token/commit/{ref}`,
          json: true,
          headers: {
            'content-type': 'application/json;charset=utf-8',
            authorization: 'Bearer {token}',
            'file-token': '{fileToken}',
          },
        },
        functions: {commit: ['token', 'ref', 'fileToken']},
      },
    ],
  };
};

@lifeCycleObserver('datasource')
export class FileServiceDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'FileService';
  static readonly defaultConfig = config;

  constructor(
    @inject(COMMON_KEYS.FILE_SERVICE_DATASOURCE_CONFIG, {
      optional: true,
    })
    dsConfig: object = config,
  ) {
    dsConfig = getConfig({...dsConfig, ...config});
    super(dsConfig);
  }
}
