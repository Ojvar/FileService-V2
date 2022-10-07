import {Model, model, property} from '@loopback/repository';
import {File} from '../models';

@model()
export class FileInfoDTO extends Model {
  @property({type: 'string', jsonSchema: {description: 'File id'}}) id: string;
  @property({type: 'string', jsonSchema: {description: 'Original filename'}})
  original_name: string;
  @property({type: 'string', jsonSchema: {description: 'File id'}})
  field_name: string;
  @property({type: 'number', jsonSchema: {description: 'File id'}})
  size: number;
  @property({type: 'string', jsonSchema: {description: 'File id'}})
  mime: string;
  @property({type: 'Date', jsonSchema: {description: 'Uploade date'}})
  uploaded_at: Date;
  @property({type: 'Date', jsonSchema: {description: 'Uploaded by'}})
  uploaded_by: string;

  /* Covnert a "File" into "FileInfoDTO" */
  static fromModel(data: File): FileInfoDTO {
    return new FileInfoDTO({
      field_name: data.field_name,
      id: data.id,
      mime: data.mime,
      original_name: data.original_name,
      size: data.size,
      uploaded_at: data.uploaded.at,
      uploaded_by: data.uploaded.by,
    });
  }

  constructor(data?: Partial<FileInfoDTO>) {
    super(data);
  }
}
