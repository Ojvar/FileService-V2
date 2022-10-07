import {inject} from '@loopback/core';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {FILE_MANAGER_SERVICE_DTO} from '../dto';
import {Credential} from '../models';
import {FileManagerService, FILE_MANAGER_SERVICE} from '../services';

export class TokenController {
  /* TODO: CHECK USER JWT - FOR AUTHORIZATION */
  @get('/token/{token}/{user_id}', {
    description: 'Get credential data',
    summary: 'Get credential data',
    tags: ['credential'],
    responses: {
      200: {
        description: 'Credential Data',
        content: {'application/json': getModelSchemaRef(Credential)},
      },
    },
  })
  async getFilesList(
    @param.path.string('token') token: string,
    @param.path.string('user_id') userId: string,
  ): Promise<Credential> {
    return this.fileManagerService.getCredential(token, userId);
  }

  /* TODO: CHECK USER JWT - FOR AUTHORIZATION */
  @del('/token/{token}/{user_id}', {
    description: 'Reject a certificate',
    summary: 'Reject a certificate',
    tags: ['credential'],
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
    tags: ['credential'],
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
    tags: ['credential'],
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
  async generateToken(
    @requestBody() body: FILE_MANAGER_SERVICE_DTO.GetTokenRequestDTO,
  ): Promise<unknown> {
    return this.fileManagerService.getToken(body);
  }

  constructor(
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
  ) {}
}
