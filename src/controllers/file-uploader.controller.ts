import {inject} from '@loopback/core';
import {
  param,
  post,
  Request,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import {FILE_SERVICE_KEYS} from '../keys';
import {FileUploadHandler} from '../types';

/* TODO: USE FILE-SERVICE SERVICE TO HANDLE UPLOADED FILE */

export class FileUploaderController {
  @post('/files/{token}/{user_id}', {
    tags: ['files', 'upload'],
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
    return new Promise<object>((resolve, reject) => {
      this.handler(request, this.response, (err: unknown) => {
        if (err) {
          return reject(err);
        }

        /* Return extracted file data */
        resolve(getSingleFile(request));
      });
    });
  }

  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject(FILE_SERVICE_KEYS.FILE_UPLOAD_SERVICE)
    private handler: FileUploadHandler,
  ) {}
}

// function getFiles(request: Request): FilesList {
//   const uploadedFiles = request.files;
//   const mapper = (f: globalThis.Express.Multer.File) => ({
//     fieldname: f.fieldname,
//     id: f.filename,
//     mimetype: f.mimetype,
//     originalname: f.originalname,
//     size: f.size,
//   });

//   let files: object[] = [];
//   if (Array.isArray(uploadedFiles)) {
//     files = uploadedFiles.map(mapper);
//   } else {
//     for (const filename in uploadedFiles) {
//       files.push(...uploadedFiles[filename].map(mapper));
//     }
//   }
//   return {files, body: request.body};
// }
