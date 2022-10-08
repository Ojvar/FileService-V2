import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, param, Response, RestBindings} from '@loopback/rest';
import path from 'path';
import {OBJECT_ID_PATTERN} from '../dto';
import {STORAGE_DIRECTORY} from '../interceptors';
import {FileRepository} from '../repositories';

export class FileDownloaderController {
  @get('/files/download/{id}', {
    tags: ['files'],
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
  ): Promise<Response> {
    const fileInfo = await this.fileRepository.getFileInfo(id);
    const filepath = path.resolve(this.storageDirectory, fileInfo.getId());
    response.download(filepath, fileInfo.original_name);
    return response;
  }

  constructor(
    @inject(STORAGE_DIRECTORY) private storageDirectory: string,
    @repository(FileRepository) private fileRepository: FileRepository,
  ) {}
}
