import {
  BindingScope,
  config,
  ContextTags,
  injectable,
  Provider,
} from '@loopback/core';
import multer from 'multer';
import {FILE_SERVICE_KEYS} from '../keys';
import {FileUploadHandler} from '../types';

@injectable({
  scope: BindingScope.TRANSIENT,
  tags: {[ContextTags.KEY]: FILE_SERVICE_KEYS.FILE_UPLOAD_SERVICE},
})
export class FileUploadServiceProvider implements Provider<FileUploadHandler> {
  constructor(@config() private options: multer.Options = {}) {
    if (!this.options.storage) {
      this.options.storage = multer.memoryStorage();
    }
  }

  value(): FileUploadHandler {
    // return multer(this.options).any();
    return multer(this.options).single('file');
  }
}
