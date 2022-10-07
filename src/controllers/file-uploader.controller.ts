import {inject, intercept} from '@loopback/core';
import {param, post, Request, requestBody} from '@loopback/rest';
import {FileHandlerInterceptor} from '../interceptors';
import {UploadedFile} from '../models';
import {FileManagerService, FILE_MANAGER_SERVICE} from '../services';

export class FileUploaderController {
  /* TODO: CHECK USER ID FROM JWT */
  @intercept(FileHandlerInterceptor.BINDING_KEY)
  @post('/files/{token}/{field}/{user_id}', {
    tags: ['file'],
    description: 'Upload files',
    summary: 'Upload files',
    responses: {
      200: {
        content: {'application/json': {schema: {type: 'object'}}},
        description: 'Files and fields',
      },
    },
  })
  async fileUpload(
    @param.path.string('user_id', {
      description: 'User id /// Temporary - it should be removed after tests',
    })
    userId: string,
    @param.path.string('token', {description: 'FileUpload token'})
    token: string,
    @param.path.string('field', {description: 'Field name'})
    field: string,
    @requestBody.file({
      description: 'multipart/form-data value.',
      required: true,
    })
    request: Request,
  ): Promise<UploadedFile> {
    return this.fileManagerService.uploadFile(userId, token, field, request);
  }

  constructor(
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
  ) {}
}
