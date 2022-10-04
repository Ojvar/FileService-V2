import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors, Request, Response, RestBindings} from '@loopback/rest';
import {FILE_SERVICE_KEYS} from '../keys';
import {FileUploadHandler} from '../types';
import {RedisService} from './redis.service';

@injectable({scope: BindingScope.TRANSIENT})
export class FileService {
  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject(FILE_SERVICE_KEYS.FILE_UPLOAD_SERVICE)
    private handler: FileUploadHandler,
    @inject(FILE_SERVICE_KEYS.REDIS_SERVICE) private redisService: RedisService,
  ) {}
}

function getSingleFile(request: Request) {
  const uploadedFile = request.file;
  if (!uploadedFile) {
    throw new HttpErrors.UnprocessableEntity('Empty file');
  }

  const file = {
    fieldname: uploadedFile.fieldname,
    id: uploadedFile.filename,
    mimetype: uploadedFile.mimetype,
    originalname: uploadedFile.originalname,
    size: uploadedFile.size,
  };
  return {file, body: request.body};
}
