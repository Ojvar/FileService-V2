import {inject, intercept} from '@loopback/core';
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
import {SECURITY_ROLES} from '../keys';
import {
  KeycloakSecurity,
  KeycloakSecurityProvider,
  protect,
} from '../lib-keycloak/src';
import {Credential, UploadedFile} from '../models';
import {FileManagerService} from '../services';

const BASE_ADDR = '/token';
const tags = ['File.Credential'];

@intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
export class CertificateController {
  constructor(
    @inject(FileManagerService.BINDING_KEY)
    private fileManagerService: FileManagerService,
    @inject(KeycloakSecurityProvider.BINDING_KEY)
    private keycloakSecurity: KeycloakSecurity,
  ) {}

  @patch(`${BASE_ADDR}/{token}/{file_id}`, {
    tags,
    description: 'Update uploaded file meta-data',
    summary: 'Update uploaded file meta-data',
    responses: {
      200: {
        description: 'Uploaded File Data',
        content: {
          'application/json': {schema: getModelSchemaRef(UploadedFile)},
        },
      },
    },
  })
  async updateMetadata(
    @requestBody({
      description: 'Data for add/remove fields',
      required: true,
    })
    body: FILE_MANAGER_SERVICE_DTO.UpdateMetadataDTO,
    @param.path.string('token') token: string,
    @param.path.string('file_id') fileId: string,
  ): Promise<UploadedFile> {
    const {sub: userId} = await this.keycloakSecurity.getUserInfo();
    return this.fileManagerService.certificateEditMetadata(
      token,
      userId,
      fileId,
      body,
    );
  }

  @get(`${BASE_ADDR}/{user_id}/{token}`, {
    tags,
    description: 'Get credential data',
    summary: 'Get credential data',
    responses: {
      200: {
        description: 'Credential Data',
        content: {
          'application/json': {schema: getModelSchemaRef(Credential)},
        },
      },
    },
  })
  getFilesList(
    @param.path.string('user_id') userId: string,
    @param.path.string('token') token: string,
  ): Promise<Credential> {
    return this.fileManagerService.getCredential(token, userId);
  }

  @del(`${BASE_ADDR}/{token}`, {
    tags,
    description: 'Reject a certificate',
    summary: 'Reject a certificate',
    responses: {204: {description: 'Reject successfully'}},
  })
  async rejectCertificate(
    @param.path.string('token') token: string,
  ): Promise<void> {
    const {sub: userId} = await this.keycloakSecurity.getUserInfo();
    await this.fileManagerService.reject(token, userId);
  }

  @post(`${BASE_ADDR}/{user_id}/{token}`, {
    tags,
    description: 'Commit a certificate',
    summary: 'Commit a certificate',
    responses: {204: {description: 'Commit successfully'}},
  })
  async commitCertificate(
    @param.path.string('user_id') userId: string,
    @param.path.string('token') token: string,
  ): Promise<void> {
    await this.fileManagerService.commit(token, userId);
  }

  @post(`${BASE_ADDR}`, {
    tags,
    description: 'Generate a file upload certificate and return file-token',
    summary: 'Generate a new file-upload certificate',
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
  generateCertificate(
    @requestBody() body: FILE_MANAGER_SERVICE_DTO.GetTokenRequestDTO,
  ): Promise<FILE_MANAGER_SERVICE_DTO.GetTokenResponseDTO> {
    return this.fileManagerService.generateCertificate(body);
  }
}
