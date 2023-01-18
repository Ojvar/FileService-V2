import { inject, intercept } from '@loopback/core';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import { FILE_MANAGER_SERVICE_DTO } from '../dto';
import { SECURITY_ROLES } from '../keys';
import {
  KeycloakSecurity,
  KEYCLOAK_SECURITY_SERVICE,
  protect,
} from '../lib-keycloak/src';
import { Credential, UploadedFile } from '../models';
import { FileManagerService, FILE_MANAGER_SERVICE } from '../services';

@intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
export class CertificateController {
  constructor(
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
    @inject(KEYCLOAK_SECURITY_SERVICE)
    private keycloakSecurityService: KeycloakSecurity,
  ) { }

  @patch('/token/{token}/{file_id}', {
    tags: ['credential'],
    description: 'Update uploaded file meta-data',
    summary: 'Update uploaded file meta-data',
    responses: {
      200: {
        description: 'Uploaded File Data',
        content: {
          'application/json': { schema: getModelSchemaRef(UploadedFile) },
        },
      },
    },
  })
  async updateMetadata(
    @requestBody({ description: 'Data for add/remove fields', required: true })
    body: FILE_MANAGER_SERVICE_DTO.UpdateMetadataDTO,
    @param.path.string('token') token: string,
    @param.path.string('file_id') fileId: string,
  ): Promise<UploadedFile> {
    const { sub: userId } = await this.keycloakSecurityService.getUserInfo();
    return this.fileManagerService.certificateEditMetadata(
      token,
      userId,
      fileId,
      body,
    );
  }

  @get('/token/{token}', {
    description: 'Get credential data',
    summary: 'Get credential data',
    tags: ['credential'],
    responses: {
      200: {
        description: 'Credential Data',
        content: { 'application/json': { schema: getModelSchemaRef(Credential) } },
      },
    },
  })
  async getFilesList(
    @param.path.string('token') token: string,
  ): Promise<Credential> {
    const { sub: userId } = await this.keycloakSecurityService.getUserInfo();
    return this.fileManagerService.getCredential(token, userId);
  }

  @del('/token/{token}', {
    description: 'Reject a certificate',
    summary: 'Reject a certificate',
    tags: ['credential'],
    responses: { 204: { description: 'Reject successfully' } },
  })
  async rejectCertificate(
    @param.path.string('token') token: string,
  ): Promise<void> {
    const { sub: userId } = await this.keycloakSecurityService.getUserInfo();
    await this.fileManagerService.reject(token, userId);
  }

  @patch('/token/{token}', {
    description: 'Commit a certificate',
    summary: 'Commit a certificate',
    tags: ['credential'],
    responses: { 204: { description: 'Commit successfully' } },
  })
  async commitCertificate(
    @param.path.string('token') token: string,
  ): Promise<void> {
    const { sub: userId } = await this.keycloakSecurityService.getUserInfo();
    await this.fileManagerService.commit(token, userId);
  }

  @post('/token', {
    description: 'Generate a file upload certificate and return file-token',
    summary: 'Generate a new file-upload certificate',
    tags: ['credential'],
    responses: {
      200: {
        description: 'Genereated certificate',
        content: {
          'application/json': {
            schema: getModelSchemaRef(
              FILE_MANAGER_SERVICE_DTO.GetTokenResponseDTO,
            ),
          },
        },
      },
    },
  })
  async generateCertificate(
    @requestBody() body: FILE_MANAGER_SERVICE_DTO.GetTokenRequestDTO,
  ): Promise<FILE_MANAGER_SERVICE_DTO.GetTokenResponseDTO> {
    return this.fileManagerService.generateCertificate(body);
  }
}
