import {inject} from '@loopback/core';
import {getModelSchemaRef, post, requestBody} from '@loopback/rest';
import {FILE_MANAGER_SERVICE_DTO} from '../dto';
import {FileManagerService, FILE_MANAGER_SERVICE} from '../services';

export class TokenController {
  @post('/token', {
    description: 'Generate a file upload certificate and return file-token',
    summary: 'Generate a new file-upload certificate',
    tags: ['token'],
    responses: {
      200: {
        description: 'Genereated token data',
        content: {
          'application/json': {
            schema: getModelSchemaRef(
              FILE_MANAGER_SERVICE_DTO.GetTokenRequestDTO,
            ),
          },
        },
      },
    },
  })
  async getToken(
    @requestBody() body: FILE_MANAGER_SERVICE_DTO.GetTokenRequestDTO,
  ): Promise<unknown> {
    return this.fileManagerService.getToken(body);
  }

  constructor(
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
  ) {}
}
