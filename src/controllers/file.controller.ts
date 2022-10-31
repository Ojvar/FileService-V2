import {inject} from '@loopback/core';
import {del, get, getModelSchemaRef, param} from '@loopback/rest';
import {FileInfoDTO, OBJECT_ID_PATTERN} from '../dto';
import {FileManagerService, FILE_MANAGER_SERVICE} from '../services';

export class FileController {
  /* TODO: CHECK USER JWT -- AUTHORIZATION */
  @get('/generate-file-access-token/{id}/{user_id}', {
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
  @get('/files/{id}/{user_id}', {
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
    @param.path.string('user_id', {description: 'User id'})
    userId: string,
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
