import { inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { get, param, Response, RestBindings } from '@loopback/rest';
import { resolve } from 'path';
import { OBJECT_ID_PATTERN } from '../dto';
import { STORAGE_DIRECTORY } from '../interceptors';
import { KeycloakSecurity, KEYCLOAK_SECURITY_SERVICE } from '../lib-keycloak/src';
import { FileRepository } from '../repositories';
import { FileManagerService, FILE_MANAGER_SERVICE } from '../services';

export class FileDownloaderController {
  constructor(
    @inject(STORAGE_DIRECTORY) private storageDirectory: string,
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
    @repository(FileRepository) private fileRepository: FileRepository,
  ) { }

  @get('/files/download/{id}', {
    tags: ['files'],
    description: 'Download file by file-id',
    summary: 'Download file by file-id',
    responses: {
      200: {
        description: 'The file content',
        content: {
          'application/octet-stream': {
            schema: { type: 'string', format: 'binary' },
          },
        },
      },
    },
  })
  async downloadFile(
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @param.path.string('id', {
      description: 'File id',
      schema: { pattern: OBJECT_ID_PATTERN },
    })
    id: string,
    @param.query.string('token', { description: 'Access token', required: false })
    accessToken = '',
  ): Promise<Response> {
    const fileInfo = await this.fileRepository.getFileInfo(id);
    if (fileInfo.is_private) {
      await this.fileManagerService.checkAccessToken(id, accessToken);
    }
    const filepath = resolve(this.storageDirectory, fileInfo.getId());
    response.setHeader('Content-type', fileInfo.mime);
    response.download(filepath, fileInfo.original_name);
    return response;
  }
}
