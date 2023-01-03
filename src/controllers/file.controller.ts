import { inject, intercept } from '@loopback/core';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
  writeResultToResponse,
} from '@loopback/rest';
import {
  FileInfoDTO,
  FileInfoListDTO,
  FILE_MANAGER_SERVICE_DTO,
  OBJECT_ID_PATTERN,
} from '../dto';
import { SECURITY_ROLES } from '../keys';
import {
  KeycloakSecurity,
  KEYCLOAK_SECURITY_SERVICE,
  protect,
} from '../lib-keycloak/src';
import { FileMeta, FileMetaArray } from '../models';
import { FileManagerService, FILE_MANAGER_SERVICE } from '../services';

export class FileController {
  constructor(
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
    @inject(KEYCLOAK_SECURITY_SERVICE)
    private keycloakSecurityService: KeycloakSecurity,
  ) { }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @patch('/files/edit/{file_id}', {
    tags: ['files'],
    description: 'Edit a file',
    summary: 'Edit a file',
    responses: { 204: { description: 'File edited successfully' } },
  })
  async editFile(
    @param.path.string('file_id', {
      description: 'File id',
      schema: { pattern: OBJECT_ID_PATTERN },
    })
    fileId: string,
    @requestBody() body: FILE_MANAGER_SERVICE_DTO.EditFileDTO,
  ): Promise<void> {
    const { sub: userId } = await this.keycloakSecurityService.getUserInfo();
    return this.fileManagerService.editFile(fileId, body, userId);
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @post('/files/find-by-meta-array', {
    tags: ['files'],
    description: 'Advance search in files metadata',
    summary: 'Advance search in metadata',
    responses: {
      200: {
        description: 'Files list',
        content: {
          'application/json': {
            schema: { type: 'array', items: getModelSchemaRef(FileInfoDTO) },
          },
        },
      },
    },
  })
  async searchMetadataAdvance(
    @requestBody({
      content: {
        'application/json': {
          schema: { type: 'array', items: { type: 'object' } },
        },
      },
    })
    body: FileMetaArray,
  ): Promise<FileInfoListDTO> {
    const { sub: userId } = await this.keycloakSecurityService.getUserInfo();
    return this.fileManagerService.searchMetadataAdvance(body, userId);
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @post('/files/find-by-meta', {
    tags: ['files'],
    description: 'Search in files metadata',
    summary: 'Search in metadata',
    responses: {
      200: {
        description: 'Files list',
        content: {
          'application/json': {
            schema: { type: 'array', items: getModelSchemaRef(FileInfoDTO) },
          },
        },
      },
    },
  })
  async searchMetadata(
    @requestBody() body: FileMeta,
  ): Promise<FileInfoListDTO> {
    const { sub: userId } = await this.keycloakSecurityService.getUserInfo();
    return this.fileManagerService.searchMetadata(body, userId);
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @patch('/files/{id}', {
    tags: ['files'],
    description: 'Update metadata of a file',
    summary: 'Update file metadata',
    responses: { 204: { description: 'Metadata updated successfully' } },
  })
  async updateMetadata(
    @param.path.string('id', {
      description: 'File id',
      schema: { pattern: OBJECT_ID_PATTERN },
    })
    id: string,
    @requestBody() body: FILE_MANAGER_SERVICE_DTO.UpdateMetadataDTO,
  ): Promise<void> {
    return this.fileManagerService.updateMetadata(id, body);
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @get('/files/generate-file-access-token/{id}', {
    tags: ['files'],
    description: 'Generate FileAccessToken for a specified user',
    summary: 'Generate FileAccessToken',
    responses: {
      200: {
        description: 'File access token',
        content: { 'text/plain': { schema: { type: 'string' } } },
      },
    },
  })
  async generateFileAccessToken(
    @param.path.string('id', {
      description: 'File id',
      schema: { pattern: OBJECT_ID_PATTERN },
    })
    id: string,
  ): Promise<string> {
    const { sub: userId } = await this.keycloakSecurityService.getUserInfo();
    const accessToken = await this.fileManagerService.generateAccessToken(
      id,
      userId,
    );
    return accessToken.token;
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @get('/files/{id}', {
    tags: ['files'],
    description: 'Get file info',
    summary: 'Get file info',
    responses: {
      200: {
        description: 'File info',
        content: { 'application/json': { schema: getModelSchemaRef(FileInfoDTO) } },
      },
    },
  })
  async getFileInfo(
    @param.path.string('id', {
      description: 'File id',
      schema: { pattern: OBJECT_ID_PATTERN },
    })
    id: string,
  ): Promise<FileInfoDTO> {
    const {sub: userId} = await this.keycloakSecurityService.getUserInfo();
    return this.fileManagerService.getFileInfo(id, userId);
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @del('/files/{id}', {
    tags: ['files'],
    description: 'Remove file',
    summary: 'Remove file',
    responses: { 204: { description: 'Remove successfully' } },
  })
  async removeFile(@param.path.string('id') id: string): Promise<void> {
    return this.fileManagerService.removeFile(id);
  }
}
