import {inject} from '@loopback/core';
import {
  post,
  Request,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import {FILE_SERVICE_KEYS} from '../keys';
import {FileUploadHandler} from '../types';

export class FileUploaderController {
  @post('/files', {
    responses: {
      200: {
        content: {'application/json': {schema: {type: 'object'}}},
        description: 'Files and fields',
      },
    },
  })
  async fileUpload(@requestBody.file() request: Request): Promise<object> {
    return new Promise<object>((resolve, reject) => {
      this.handler(request, this.response, (err: unknown) => {
        return err
          ? reject(err)
          : resolve(FileUploaderController.getFiles(request));
      });
    });
  }

  private static getFiles(request: Request) {
    const uploadedFiles = request.files;
    const mapper = (f: globalThis.Express.Multer.File) => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    });
    let files: object[] = [];
    if (Array.isArray(uploadedFiles)) {
      files = uploadedFiles.map(mapper);
    } else {
      for (const filename in uploadedFiles) {
        files.push(...uploadedFiles[filename].map(mapper));
      }
    }
    return files;
  }

  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject(FILE_SERVICE_KEYS.FILE_UPLOAD_SERVICE)
    private handler: FileUploadHandler,
  ) {}
}
