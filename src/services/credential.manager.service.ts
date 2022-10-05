import {BindingKey, BindingScope, injectable} from '@loopback/core';
import {ObjectId} from 'bson';
import {Credential} from '../models';
import {StringArray} from '../types';

@injectable({scope: BindingScope.TRANSIENT})
export class CredentialManagerService {
  private _credentials: Credentials = {};

  get credentials(): Readonly<Credentials> {
    return this._credentials;
  }

  async addCredential(credential: Credential): Promise<number> {
    const entryIndex = Math.ceil(credential.expire_time / C_BUCKET_INTERVAL);
    const list = this.getCredentialsList(entryIndex, true);
    list.push(credential.id.toString());
    return entryIndex;
  }

  async removeCredential(credential: Credential) {
    const entryIndex = Math.ceil(credential.expire_time / C_BUCKET_INTERVAL);
    if (!this._credentials[entryIndex]) {
      return;
    }
    this._credentials[entryIndex] = this._credentials[entryIndex].filter(
      x => x === credential.id.toString(),
    );
  }

  async removeEntry(entryIndex: number): Promise<StringArray> {
    const list = this.getCredentialsList(entryIndex);
    if (!list) {
      delete this._credentials[entryIndex];
      return list;
    }
    return [];
  }

  clearEntries() {
    this._credentials = {};
  }

  getCredentialsList(
    entryIndex: number,
    createNewEntry: boolean = false,
  ): StringArray {
    let list = this._credentials[entryIndex];
    if (!list && createNewEntry) {
      list = [];
      this._credentials[entryIndex] = list;
    }
    return list;
  }

  constructor() {
    this._credentials = {};
  }
}

export type Credentials = Record<number, StringArray>;
export type CredentialEntry = {
  expire_at: number;
  token: ObjectId;
};
export type CredentialEntries = CredentialEntry[];
export const C_BUCKET_INTERVAL = 300_000; /* 5 Minutes */
export const CREDENTIAL_MANAGER_SERVICE =
  BindingKey.create<CredentialManagerService>(
    'services.CredentialManagerService',
  );
