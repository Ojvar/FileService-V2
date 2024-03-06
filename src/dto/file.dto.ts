import { model, property } from '@loopback/repository';

export namespace FILE_DTO {
  @model()
  export class FileUrlDTO {
    @property({ type: 'string' })
    original: string;
    @property({ type: 'string' })
    thumbnail?: string;
  }

  @model()
  export class FileItemDTO {
    @property({ type: 'string' })
    id?: string;
    @property({ type: 'string' })
    url: FileUrlDTO;
    @property({ type: 'string' })
    original_name: string;
    @property({ type: 'date' })
    uploaded_at: Date;
    @property({ type: 'string' })
    mimetype: string;
    @property({ type: 'number' })
    size: number;
    @property({ type: 'string' })
    filename: string;
  }
}
