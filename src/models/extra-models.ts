import {model, property} from '@loopback/repository';

@model()
export class TimeStampModel {
  @property({type: 'date'}) at: Date;
  @property({type: 'string'}) by: string;
}
