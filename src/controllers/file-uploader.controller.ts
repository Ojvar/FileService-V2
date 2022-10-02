import {inject} from '@loopback/core';
import {
  HttpErrors,
  post,
  Request,
  RequestBody,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import {FILE_SERVICE_KEYS} from '../keys';
import {FileUploadHandler} from '../types';

type FilesList = {
  files: object[];
  body: RequestBody;
};

export class FileUploaderController {
  @post('/files', {
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
        const {file, body} = getSingleFile(request);
        resolve(file);
      });
    });
  }

  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject(FILE_SERVICE_KEYS.FILE_UPLOAD_SERVICE)
    private handler: FileUploadHandler,
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
