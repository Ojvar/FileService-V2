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
  KeycloakSecurity,
  KeycloakSecurityProvider,
  protect,
} from '../lib-keycloak/src';
import {UploadedFile} from '../models';
import {FileManagerService} from '../services';

const BASE_ADDR = '/files';
const tags = ['Files.Upload'];

export class FileUploaderController {
  constructor(
    @inject(FileManagerService.BINDING_KEY)
    private fileManagerService: FileManagerService,
    @inject(KeycloakSecurityProvider.BINDING_KEY)
    private keycloakSecurity: KeycloakSecurity,
  ) {}

  @intercept(protect(SECURITY_ROLES.NO_BODY))
  @intercept(FileHandlerInterceptor.BINDING_KEY)
  @post(`${BASE_ADDR}/{field}`, {
    tags,
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
