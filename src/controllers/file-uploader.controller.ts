import {inject, intercept} from '@loopback/core';
import {
  getModelSchemaRef,
  param,
  post,
  Request,
  requestBody,
} from '@loopback/rest';
import {FileHandlerInterceptor} from '../interceptors';
import {SECURITY_ROLES} from '../keys';
import {
  KEYCLOAK_SECURITY_SERVICE,
  KeycloakSecurity,
  protect,
} from '../lib-keycloak/src';
import {UploadedFile} from '../models';
import {FILE_MANAGER_SERVICE, FileManagerService} from '../services';

export class FileUploaderController {
  constructor(
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
    @inject(KEYCLOAK_SECURITY_SERVICE)
    private keycloakSecurity: KeycloakSecurity,
  ) {}

  @intercept(protect(SECURITY_ROLES.NO_BODY))
  @intercept(FileHandlerInterceptor.BINDING_KEY)
  @post('/files/{field}', {
    tags: ['files'],
    description: 'Upload files',
    summary: 'Upload files',
    responses: {
      200: {
        content: {
          'application/json': {schema: getModelSchemaRef(UploadedFile)},
          description: 'Files and fields',
        },
      },
    },
  })
  async fileUpload(
    @param.header.string('file-token', {
      description: 'FileUpload token',
    })
    token: string,
    @param.path.string('field', {description: 'Field name'}) field: string,
    @requestBody.file({
      description: 'multipart/form-data value.',
      required: true,
    })
    request: Request,
  ): Promise<UploadedFile> {
    const {sub: userId} = await this.keycloakSecurity.getUserInfo();
    return this.fileManagerService.uploadFile(userId, token, field, request);
  }
}
