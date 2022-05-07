import {inject, intercept} from '@loopback/core';
import {param, post, Request, requestBody} from '@loopback/rest';
// import debugFactory from 'debug';
import {unlink} from 'fs';
import {protect} from '../interceptors';
import {FileService} from '../keys';
import {FileData} from '../models';
import {RedisService, UploadRequestHandlerService} from '../services';

// const trace = debugFactory('FileService:UploadController');

export class UploadController {
  @intercept(protect('realm:no-body'))
  @post('/file/{field}', {
    responses: {
      200: {
        content: {'application/json': {schema: {type: 'object'}}},
        description: 'Files and fields',
      },
    },
  })
  async uploadFile(
    @param.header.string('file-token') fileToken: string,
    @param.path.string('field') field: string,
    @requestBody.file() request: Request,
    // @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(FileService.REDIS_SERVICE) redisService: RedisService,
    @inject(FileService.UPLOAD_REQUEST_HANDLER_SERVICE)
    uploadRequestHandlerService: UploadRequestHandlerService,
  ): Promise<object> {
    const {files} = getFilesAndFields(request);

    try {
      const fileRequest = await uploadRequestHandlerService.checkHeader(
        request,
        field,
        files,
      );
      const token = request.header(FileService.HEADER_TOKEN) ?? '';

      fileRequest.uploaded_files = fileRequest.uploaded_files ?? {};

      /* Remove old file, when user wants to replace by new one */
      const prevUploadedFile = fileRequest.uploaded_files[field];
      if (prevUploadedFile) {
        unlink(prevUploadedFile.path, err => console.error);
        delete fileRequest.uploaded_files[field];
      }

      /* Update uploaded files */
      fileRequest.uploaded_files[field] = new FileData(
        files[0] as Express.Multer.File,
      );

      /* Update redis */
      await redisService.client.SET(token, fileRequest.toString());
    } catch (err) {
      uploadRequestHandlerService.removeFiles(files);
      throw err;
    }

    return {name: request.file?.filename};
  }
}

export function getFilesAndFields<T = unknown>(
  request: Request,
): {files: UploadFileItem[]; fields: T} {
  const uploadedFiles = request.files ?? [];
  const mapper = (file: globalThis.Express.Multer.File) => ({
    fieldname: file.fieldname,
    originalname: file.originalname,
    filename: file.filename,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
  });

  const files: UploadFileItem[] = Array.isArray(uploadedFiles)
    ? uploadedFiles.map(mapper)
    : uploadedFiles &&
      Object.keys(uploadedFiles).reduce((total: UploadFileItem[], key) => {
        total.push(...uploadedFiles[key].map(mapper));
        return total;
      }, []);

  return {files: files ?? [], fields: request.body};
}

export type UploadFileItem = {
  fieldname: string;
  originalname: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
};
