import {inject} from '@loopback/core';
import {get, getModelSchemaRef, param} from '@loopback/rest';
import {FileInfoDTO, OBJECT_ID_PATTERN} from '../dto';
import {FileManagerService, FILE_MANAGER_SERVICE} from '../services';

export class FileController {
  /* TODO: CHECK USER JWT -- AUTHORIZATION */
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
  ): Promise<FileInfoDTO> {
    return this.fileManagerService.getFileInfo(id);
  }

  constructor(
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
  ) {}
}
