import {inject} from '@loopback/core';
import {
  del,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {FILE_MANAGER_SERVICE_DTO} from '../dto';
import {FileManagerService, FILE_MANAGER_SERVICE} from '../services';

export class TokenController {
  /* TODO: CHECK USER JWT - FOR AUTHORIZATION */
  @del('/token/{token}/{user_id}', {
    description: 'Reject a certificate',
    summary: 'Reject a certificate',
    tags: ['token'],
    responses: {204: {description: 'Reject successfully'}},
  })
  async rejectCertificate(
    @param.path.string('token') token: string,
    @param.path.string('user_id') userId: string,
  ): Promise<void> {
    await this.fileManagerService.reject(token, userId);
  }

  /* TODO: CHECK USER JWT - FOR AUTHORIZATION */
  @patch('/token/{token}/{user_id}', {
    description: 'Commit a certificate',
    summary: 'Commit a certificate',
    tags: ['token'],
    responses: {204: {description: 'Commit successfully'}},
  })
  async commitCertificate(
    @param.path.string('token') token: string,
    @param.path.string('user_id') userId: string,
  ): Promise<void> {
    await this.fileManagerService.commit(token, userId);
  }

  /* TODO: CHECK USER JWT - FOR AUTHORIZATION */
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
