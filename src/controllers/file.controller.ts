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
import {
  FILE_MANAGER_SERVICE_DTO,
  FileInfoDTO,
  FileInfoListDTO,
  OBJECT_ID_PATTERN,
} from '../dto';
import {SECURITY_ROLES} from '../keys';
import {
  KeycloakSecurity,
  KeycloakSecurityProvider,
  protect,
} from '../lib-keycloak/src';
import {FileMeta, FileMetaArray} from '../models';
import {FileManagerService} from '../services';

const BASE_ADDR = '/files';
const tags = ['Files'];

export class FileController {
  constructor(
    @inject(FileManagerService.BINDING_KEY)
    private fileManagerService: FileManagerService,
    @inject(KeycloakSecurityProvider.BINDING_KEY)
    private keycloakSecurity: KeycloakSecurity,
  ) {}

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @patch(`${BASE_ADDR}/edit/{file_id}`, {
    tags,
    description: 'Edit a file',
    summary: 'Edit a file',
    responses: {204: {description: 'File edited successfully'}},
  })
  async editFile(
    @param.path.string('file_id', {
      description: 'File id',
      schema: {pattern: OBJECT_ID_PATTERN},
    })
    fileId: string,
    @requestBody() body: FILE_MANAGER_SERVICE_DTO.EditFileDTO,
  ): Promise<void> {
    const {sub: userId} = await this.keycloakSecurity.getUserInfo();
    return this.fileManagerService.editFile(fileId, body, userId);
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @post(`${BASE_ADDR}/find-by-meta-array`, {
    tags,
    description: 'Advance search in files metadata',
    summary: 'Advance search in metadata',
    responses: {
      200: {
        description: 'Files list',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(FileInfoDTO)},
          },
        },
      },
    },
  })
  async searchMetadataAdvance(
    @requestBody({
      content: {
        'application/json': {
          schema: {type: 'array', items: {type: 'object'}},
        },
      },
    })
    body: FileMetaArray,
  ): Promise<FileInfoListDTO> {
    const {sub: userId} = await this.keycloakSecurity.getUserInfo();
    return this.fileManagerService.searchMetadataAdvance(body, userId);
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @post(`${BASE_ADDR}/find-by-meta`, {
    tags,
    description: 'Search in files metadata',
    summary: 'Search in metadata',
    responses: {
      200: {
        description: 'Files list',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(FileInfoDTO)},
          },
        },
      },
    },
  })
  async searchMetadata(
    @requestBody() body: FileMeta,
  ): Promise<FileInfoListDTO> {
    const {sub: userId} = await this.keycloakSecurity.getUserInfo();
    return this.fileManagerService.searchMetadata(body, userId);
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @patch(`${BASE_ADDR}/{id}`, {
    tags,
    description: 'Update metadata of a file',
    summary: 'Update file metadata',
    responses: {204: {description: 'Metadata updated successfully'}},
  })
  updateMetadata(
    @param.path.string('id', {
      description: 'File id',
      schema: {pattern: OBJECT_ID_PATTERN},
    })
    id: string,
    @requestBody() body: FILE_MANAGER_SERVICE_DTO.UpdateMetadataDTO,
  ): Promise<void> {
    return this.fileManagerService.updateMetadata(id, body);
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @get(`${BASE_ADDR}/generate-file-access-token/{id}`, {
    tags,
    description: 'Generate FileAccessToken for a specified user',
    summary: 'Generate FileAccessToken',
    responses: {
      200: {
        description: 'File access token',
        content: {'text/plain': {schema: {type: 'string'}}},
      },
    },
  })
  async generateFileAccessToken(
    @param.path.string('id', {
      description: 'File id',
      schema: {pattern: OBJECT_ID_PATTERN},
    })
    id: string,
  ): Promise<string> {
    const {sub: userId} = await this.keycloakSecurity.getUserInfo();
    const accessToken = await this.fileManagerService.generateAccessToken(
      id,
      userId,
    );
    return accessToken.token;
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @post(`${BASE_ADDR}/info`, {
    tags,
    summary: 'Get file(s) information',
    description: 'Get file(s) information',
    responses: {
      200: {
        description: 'File(s) information',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(FileInfoDTO)},
          },
        },
      },
    },
  })
  async getFilesInfo(
    @requestBody() body: FILE_MANAGER_SERVICE_DTO.GetFileInfoRequestDTO,
  ): Promise<FileInfoListDTO> {
    const {sub: userId} = await this.keycloakSecurity.getUserInfo();
    return this.fileManagerService.getFilesInfo(body.files, userId);
  }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @del(`${BASE_ADDR}/{id}`, {
    tags,
    description: 'Remove file',
    summary: 'Remove file',
    responses: {204: {description: 'Remove successfully'}},
  })
  removeFile(@param.path.string('id') id: string): Promise<void> {
    return this.fileManagerService.removeFile(id);
  }
}
