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
import {
  FileInfoDTO,
  FileInfoListDTO,
  FILE_MANAGER_SERVICE_DTO,
  OBJECT_ID_PATTERN,
} from '../dto';
import {FileMeta, FileMetaArray} from '../models';
import {FileManagerService, FILE_MANAGER_SERVICE} from '../services';

export class FileController {
  /* TODO: CHECK USER JWT -- AUTHORIZATION */
  @post('/files/find-by-meta-array/{user_id}', {
    tags: ['files'],
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
    @param.path.string('user_id') userId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {type: 'array', items: {type: 'object'}},
        },
      },
    })
    body: FileMetaArray,
  ): Promise<FileInfoListDTO> {
    /* TODO: CHECK CLIENT PERMISSION -- JWT CHECK */
    return this.fileManagerService.searchMetadataAdvance(body, userId);
  }

  /* TODO: CHECK USER JWT -- AUTHORIZATION */
  @post('/files/find-by-meta/{user_id}', {
    tags: ['files'],
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
    @param.path.string('user_id') userId: string,
    @requestBody() body: FileMeta,
  ): Promise<FileInfoListDTO> {
    /* TODO: CHECK CLIENT PERMISSION -- JWT CHECK */
    return this.fileManagerService.searchMetadata(body, userId);
  }

  /* TODO: CHECK USER JWT -- AUTHORIZATION */
  @patch('/files/{id}', {
    tags: ['files'],
    description: 'Update metadata of a file',
    summary: 'Update file metadata',
    responses: {204: {description: 'Metadata updated successfully'}},
  })
  async updateMetadata(
    @param.path.string('id', {
      description: 'File id',
      schema: {pattern: OBJECT_ID_PATTERN},
    })
    id: string,
    @requestBody() body: FILE_MANAGER_SERVICE_DTO.UpdateMetadataDTO,
  ): Promise<void> {
    /* TODO: CHECK CLIENT PERMISSION -- JWT CHECK */
    return this.fileManagerService.updateMetadata(id, body);
  }

  /* TODO: CHECK USER JWT -- AUTHORIZATION */
  @get('/files/generate-file-access-token/{id}/{user_id}', {
    tags: ['files'],
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
    @param.path.string('user_id', {description: 'User id'})
    userId: string,
  ): Promise<string> {
    /* TODO: CHECK CLIENT PERMISSION -- JWT CHECK */
    const accessToken = await this.fileManagerService.generateAccessToken(
      id,
      userId,
    );
    return accessToken.token;
  }

  /* TODO: CHECK USER JWT -- AUTHORIZATION */
  /* user_id Should fetch from JWT token */
  @get('/files/{id}', {
    tags: ['files'],
    description: 'Get file info',
    summary: 'Get file info',
    responses: {
      200: {
        description: 'File info',
        content: {'application/json': {schema: getModelSchemaRef(FileInfoDTO)}},
      },
    },
  })
  async getFileInfo(
    @param.path.string('id', {
      description: 'File id',
      schema: {pattern: OBJECT_ID_PATTERN},
    })
    id: string,
    @param.query.string('user_id', {required: false, description: 'User id'})
    userId = '',
  ): Promise<FileInfoDTO> {
    return this.fileManagerService.getFileInfo(id, userId);
  }

  /* TODO: CHECK USER JWT -- AUTHORIZATION */
  @del('/files/{id}', {
    tags: ['files'],
    description: 'Remove file',
    summary: 'Remove file',
    responses: {204: {description: 'Remove successfully'}},
  })
  async removeFile(@param.path.string('id') id: string): Promise<void> {
    return this.fileManagerService.removeFile(id);
  }

  constructor(
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
  ) {}
}
