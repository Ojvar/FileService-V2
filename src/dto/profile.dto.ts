/* eslint-disable @typescript-eslint/naming-convention */
import { model, property } from '@loopback/repository';
import {
  enumNumberFilterFnc,
  enumStringFilterFnc,
  enumValues,
  enumValuesNumber,
} from '../helpers';
import { COMMON_ENUMS, COMMON_MODELS } from '../models';
import { FILE_DTO } from './file.dto';
import { PROFILE_ENUM } from '../enum';

export namespace PROFILE_DTO {
  @model()
  export class AttachmentResponseDTO {
    @property({ type: 'string' })
    id: string;
    @property({ type: 'created' })
    cerated: Date;
    @property({ type: 'updated' })
    updated: Date;
    @property()
    attachments?: FilesListResult | undefined;
  }

  @model()
  export class PersonalData {
    @property({ type: 'string', required: true })
    first_name: string;
    @property({ type: 'string', required: true })
    last_name: string;
    @property({ type: 'string', required: true })
    latin_first_name: string;
    @property({ type: 'string', required: true })
    latin_last_name: string;
    @property({ type: 'string', required: true })
    father_name: string;
    @property({
      type: 'number',
      required: true,
      jsonSchema: {
        type: 'number',
        enum: enumValuesNumber(COMMON_ENUMS.EnumGender),
      },
    })
    gender: COMMON_ENUMS.EnumGender;
  }

  @model()
  export class IdCertSerial {
    /* OBJECT_ID : REFERENCE TO BASE_DATA */
    @property({ type: 'string', required: true })
    letter: string;
    @property({ type: 'number', required: false })
    number?: number;
    @property({ type: 'string', required: true })
    serial: number;
  }

  @model()
  export class IdCertItemData {
    @property({ type: 'number' })
    id_issuance: number;
    @property({ type: 'number' })
    id_number: number;
    @property({ type: 'date' })
    birth_date: Date;
    @property()
    birth_place: COMMON_MODELS.Location;
    @property()
    id_serial: IdCertSerial;
    @property({ type: 'date' })
    issuance_date: Date;
    @property()
    issuance_place: COMMON_MODELS.Location;
    /* ObjectId: Reference of Countries */
    @property({ type: 'string' })
    nationality: string;
  }

  @model()
  export class NIdCardData {
    @property({ type: 'string', required: true })
    id: string;
  }

  @model()
  export class ReligionItemData {
    /* ObjectId: Refernce to of BaseData */
    @property({ type: 'string', required: true })
    id: string;
    @property({ type: 'string' })
    description?: string;
  }

  @model()
  export class MaritalItemData {
    /* ObjectId: Refernce of BaseData */
    @property({ type: 'string', required: true })
    id: string;
    @property({ type: 'number', required: false, default: 0 })
    children?: number;
  }

  @model()
  export class AttachmentItem {
    @property({ type: 'string', required: true })
    id: string;
    @property({ required: true })
    created: COMMON_MODELS.ModifyStamp;
    @property()
    deleted?: COMMON_MODELS.ModifyStamp;
  }
  export type AttachmentItems = AttachmentItem[];

  @model()
  export class IdCertHistory {
    updated: COMMON_MODELS.ModifyStamp;
    snapshot: Omit<IdCertRegisterRequestDTO, 'history'>;
  }
  export type IdCertHistories = IdCertHistory[];

  @model()
  export class IdCertRegisterRequestDTO {
    @property()
    personal: PersonalData;
    @property()
    id_cert: IdCertItemData;
    @property()
    n_card: NIdCardData;
    @property()
    religion?: ReligionItemData;
    @property()
    marital?: MaritalItemData;
    @property.array(String)
    deleted_files?: string[];
  }

  @model()
  export class AttachmentItemInfo {
    @property({ type: 'string', required: true })
    id: string;
    @property({ type: 'string', required: true })
    name: string;
    @property({ type: 'string', required: true })
    filename: string;
    @property({ type: 'number', required: true })
    size: number;
    @property({ type: 'string', required: true })
    url: string;
    @property({ type: 'string', required: true })
    preview: string;
    @property({ required: true })
    created: COMMON_MODELS.ModifyStamp;
  }
  export type AttachmentItemsInfo = Record<string, AttachmentItemInfo>;

  @model()
  export class IdCertResponseDTO {
    @property({ type: 'string' })
    id: string;
    @property()
    personal: PersonalData;
    @property()
    id_cert: IdCertItemData;
    @property()
    n_card: NIdCardData;
    @property()
    religion?: ReligionItemData;
    @property()
    marital?: MaritalItemData;
    @property()
    status?: COMMON_ENUMS.EnumStatus;
    @property()
    attachments?: FilesListResult | undefined;
  }
  export type FilesListResult = Record<string, FILE_DTO.FileItemDTO>;

  @model()
  export class UpdateItemsStatusRequest {
    @property({
      type: 'array',
      itemType: 'string',
      required: true,
      jsonSchema: {
        type: 'string',
        enum: enumValues(PROFILE_ENUM.EnumFileTokenRefs, enumStringFilterFnc),
      },
    })
    items: PROFILE_ENUM.EnumFileTokenRefs[];
    @property({ type: 'string', required: true })
    user_id: string;
    @property({ required: true })
    updated: COMMON_MODELS.ModifyStamp;
    @property({ type: 'number', required: true })
    status: COMMON_ENUMS.EnumStatus;

    @property({ type: 'string', required: false, default: undefined })
    description?: string;

    @property({
      type: 'array',
      itemType: 'number',
      required: false,
      default: [],
      jsonSchema: {
        type: 'number',
        enum: enumValues(COMMON_ENUMS.EnumStatus, enumNumberFilterFnc),
      },
    })
    current_status?: Array<COMMON_ENUMS.EnumStatus>;
  }
}
