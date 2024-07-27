/* eslint-disable @typescript-eslint/naming-convention */
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, param, Response, RestBindings} from '@loopback/rest';
import {resolve} from 'path';
import {OBJECT_ID_PATTERN} from '../dto';
import {FileRepository} from '../repositories';
import {FileManagerService} from '../services';
import {FileHandlerInterceptor} from '../interceptors';

const BASE_ADDR = '/files';
const tags = ['Files.Download'];

export class FileDownloaderController {
  constructor(
    @inject(FileHandlerInterceptor.STORAGE_DIRECTORY)
    private storageDirectory: string,
    @inject(FileManagerService.BINDING_KEY)
    private fileManagerService: FileManagerService,
    @repository(FileRepository) private fileRepository: FileRepository,
  ) {}

  @get(`${BASE_ADDR}/download/{id}`, {
    tags,
    description: 'Download file by file-id',
    summary: 'Download file by file-id',
    responses: {
      200: {
        description: 'The file content',
        content: {
          'application/octet-stream': {
            schema: {type: 'string', format: 'binary'},
          },
        },
      },
    },
  })
  async downloadFile(
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @param.path.string('id', {
      description: 'File id',
      schema: {pattern: OBJECT_ID_PATTERN},
    })
    id: string,
    @param.query.string('token', {
      description: 'Access token',
      required: false,
    })
    accessToken = '',
  ): Promise<Response> {
    const {
      id: fileId,
      mime,
      original_name,
      is_private,
    } = await this.fileRepository.getFileInfo(id);
    if (is_private) {
      await this.fileManagerService.checkAccessToken(id, accessToken);
    }
    const filepath = resolve(this.storageDirectory, fileId!);
    response.setHeader('Content-type', mime);
    response.download(filepath, original_name);
    return response;
  }
}
