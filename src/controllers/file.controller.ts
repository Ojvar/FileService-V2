/* eslint-disable @typescript-eslint/naming-convention */
import {inject, intercept} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  post,
  Request,
  requestBody,
  response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import {FILE_DTO, getServerUrl} from 'qeng-common';
// import debugFactory from 'debug';
import {protect} from '../interceptors';
import {FileService} from '../keys';
import {EnumRequestTokenStatus, File, FileData, RequestToken} from '../models';
import {FileRepository} from '../repositories';
import {RedisService} from '../services';

type FilesListResult = Record<string, FILE_DTO.FileItemDTO>;

// const trace = debugFactory('FileService:FileController');
const FileResponseContent: ResponseObject = {
  content: {
    'application/json': {
      schema: {type: 'array', items: getModelSchemaRef(FILE_DTO.FileItemDTO)},
    },
  },
  description: '',
};

export class FileController {
  constructor(@inject(FileService.REDIS_SERVICE) private redis: RedisService) {}

  @intercept(protect('realm:no-body'))
  @get('/files-list/{ref}')
  @response(200, FileResponseContent)
  async getRedisFiles(
    @param.header.string('file-token') fileToken: string,
    @param.path.string('ref') ref: string,
  ): Promise<Record<string, FileData>> {
    const request = await this.redis.client.GET(fileToken);
    const fileRequest = RequestToken.toJSON(request);

    if (
      fileRequest?.status === EnumRequestTokenStatus.DISMISSED ||
      fileRequest.ref !== ref
    ) {
      throw new HttpErrors.BadRequest('Access denied');
    }

    if (fileRequest.uploaded_files) {
      Object.values(fileRequest.uploaded_files).forEach(
        value => (value.path = value.filename),
      );
      return fileRequest.uploaded_files ?? {};
    }

    return {};
  }

  @intercept(protect('realm:no-body'))
  @post('/files-info')
  @response(200, FileResponseContent)
  async getDbFiles(
    @repository(FileRepository) filesRepo: FileRepository,
    @inject(RestBindings.Http.REQUEST) req: Request,
    @inject(FileService.SERVER_URL) serverUrl: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {type: 'string'},
            description: "File's id list",
          },
        },
      },
    })
    files: string[],
  ): Promise<FilesListResult> {
    if (files.length > 50) {
      files = files.splice(0, 50);
    }

    const filesList = await filesRepo.find({
      where: {id: {inq: files}, deleted: {eq: undefined}},
    });

    serverUrl = getServerUrl(req, serverUrl);
    return filesList.reduce((result: FilesListResult, item: File) => {
      result[item.id as string] = {
        id: item.id,
        uploaded_at: item.uploaded.at,
        original_name: item.original_name,
        mimetype: item.mimetype,
        size: item.size,
        filename: item.filename,
        url: getFileUrl(serverUrl, item.filename),
      };
      return result;
    }, {});
  }
}

function getFileUrl(serverUrl: string, name: string): FILE_DTO.FileUrlDTO {
  return {
    original: `${serverUrl}/file/${name}`,
    thumbnail: `${serverUrl}/file/${name}?thumb=1`,
  };
}
