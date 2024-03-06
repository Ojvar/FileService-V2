import { model, property } from '@loopback/repository';
import { enumValuesNumber } from '../helpers';
import { COMMON_ENUMS } from './enums';

export namespace COMMON_MODELS {
  @model()
  export class ModifyStamp {
    @property({ type: 'date', required: true })
    at: Date;
    @property({ type: 'string', required: true })
    by: string /* OBJECT_ID */;
  }

  @model()
  export class AssignStamp {
    @property({ type: 'string', required: true })
    to: string;
    @property({ type: 'date', required: true })
    at: Date;
    @property({ type: 'string', required: true })
    by: string;
  }

  @model()
  export class ReferenceModel {
    @property({ type: 'number', required: true })
    version: number;
    @property({ type: 'string', required: true })
    id: string;
  }

  @model()
  export class Location {
    @property({ type: 'string', required: true })
    country: string;
    @property({ type: 'string', required: true })
    province: string;
    @property({ type: 'string', required: true })
    city: string;
  }

  @model()
  export class StatusItem {
    @property({
      type: 'number',
      required: true,
      jsonSchema: {
        type: 'number',
        enum: enumValuesNumber(COMMON_ENUMS.EnumStatus),
      },
    })
    status: COMMON_ENUMS.EnumStatus;

    @property({ required: true })
    updated: ModifyStamp;
    @property({ type: 'string' })
    description?: string;

    @property.array(StatusItem, { required: false, default: [] })
    history?: StatusItem[];
  }

  @model()
  export class AttachmentItem {
    @property({ type: 'string', required: true })
    id: string;
    @property({ required: true })
    created: ModifyStamp;
    @property()
    deleted?: ModifyStamp;
  }
  export type Attachments = Record<string, AttachmentItem>;
}
