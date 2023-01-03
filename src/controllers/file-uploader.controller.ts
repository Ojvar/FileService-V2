import {inject, intercept} from '@loopback/core';
import {
  post,
  Request,
  requestBody,
  getModelSchemaRef,
  param,
} from '@loopback/rest';
import { FileHandlerInterceptor } from '../interceptors';
import { SECURITY_ROLES } from '../keys';
import { protect } from '../lib-keycloak/src';
import { KeycloakSecurity, KEYCLOAK_SECURITY_SERVICE } from '../lib-keycloak/src';
import { UploadedFile } from '../models';
import { FileManagerService, FILE_MANAGER_SERVICE } from '../services';

export class FileUploaderController {
  constructor(
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
    @inject(KEYCLOAK_SECURITY_SERVICE)
    private keycloakSecurityService: KeycloakSecurity,
  ) { }

  @intercept(protect(SECURITY_ROLES.FILE_SERVICE_MANAGER))
  @intercept(FileHandlerInterceptor.BINDING_KEY)
  @post('/files/{token}/{field}', {
    tags: ['files'],
    description: 'Upload files',
    summary: 'Upload files',
    responses: {
      200: {
        content: {
          'application/json': { schema: getModelSchemaRef(UploadedFile) },
          description: 'Files and fields',
        },
      },
    },
  })
  async fileUpload(
    @param.path.string('token', { description: 'FileUpload token' })
    token: string,
    @param.path.string('field', { description: 'Field name' })
    field: string,
    @requestBody.file({
      description: 'multipart/form-data value.',
      required: true,
    })
    request: Request,
  ): Promise<UploadedFile> {
    const { sub: userId } = await this.keycloakSecurityService.getUserInfo();
    return this.fileManagerService.uploadFile(userId, token, field, request);
  }
}
