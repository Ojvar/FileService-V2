import {inject, intercept} from '@loopback/core';
import {param, post, Request, requestBody} from '@loopback/rest';
import {FileHandlerInterceptor} from '../interceptors';
import {FileManagerService, FILE_MANAGER_SERVICE} from '../services';

export class FileUploaderController {
  @intercept(FileHandlerInterceptor.BINDING_KEY)
  @post('/files/{token}/{user_id}', {
    tags: ['file-upload'],
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
    @requestBody.file({
      description: 'multipart/form-data value.',
      required: true,
    })
    request: Request,
  ): Promise<object> {
    const data = this.fileManagerService.getUploadedFile(request).file;
    return data;
  }

  constructor(
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
  ) {}
}
