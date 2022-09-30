import {inject} from '@loopback/core';
import {getModelSchemaRef, post, requestBody} from '@loopback/rest';
import {FILE_MANAGER_SERVICE} from '../dto';
import {FILE_SERVICE_KEYS} from '../keys';
import {FileManagerService} from '../services';

export class TokenController {
  @post('/token', {
    description: 'Generate a file upload certificate and return file-token',
    summary: 'Generate a new file-upload certificate',
    responses: {
      200: {
        description: 'Genereated token data',
        content: {
          'application/json': {
            schema: getModelSchemaRef(FILE_MANAGER_SERVICE.GetTokenRequestDTO),
          },
        },
      },
    },
  })
  async getToken(
    @requestBody() body: FILE_MANAGER_SERVICE.GetTokenRequestDTO,
  ): Promise<unknown> {
    return this.fileManagerService.getToken(body);
  }

  constructor(
    @inject(FILE_SERVICE_KEYS.FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
  ) {}
}
