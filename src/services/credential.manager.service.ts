import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {ObjectId} from 'bson';
import {unlink} from 'fs/promises';
import path from 'path';
import {STORAGE_DIRECTORY} from '../interceptors';
import {Credential} from '../models';
import {StringArray} from '../types';
import {RedisService, REDIS_SERVICE} from './redis.service';

export type CredentialManagerServiceConfig = {
  bucketInterval: number;
};
export type Credentials = Record<number, StringArray>;
export type CredentialEntry = {
  expire_at: number;
  token: ObjectId;
};
export type CredentialEntries = CredentialEntry[];
export const CREDENTIAL_MANAGER_SERVICE =
  BindingKey.create<CredentialManagerService>(
    'services.CredentialManagerService',
  );
export const CREDENTIAL_MANAGER_SERVICE_CONFIG =
  BindingKey.create<CredentialManagerServiceConfig>(
    'services.config.CredentialManagerService',
  );

@injectable({scope: BindingScope.TRANSIENT})
export class CredentialManagerService {
  private getEntry(timeStamp: number): number {
    return Math.ceil(timeStamp / this.configs.bucketInterval);
  }

  async pruneLastExpiredEntry() {
    const lastEntryTime = this.getEntry(
      +new Date() - this.configs.bucketInterval,
    );
    return this.removeEntry(lastEntryTime);
  }

  async addCredential(credential: Credential): Promise<number> {
    const entryIndex = this.getEntry(credential.expire_time);
    const list = this.getCredentialsList(entryIndex, true);
    if (!list) {
      throw new HttpErrors.InternalServerError('Entry creation failed');
    }
    list.push(credential.getKey());
    return entryIndex;
  }

  async removeCredential(credential: Credential) {
    const entryIndex = this.getEntry(credential.expire_time);
    if (!this._credentials[entryIndex]) {
      return;
    }
    this._credentials[entryIndex] = this._credentials[entryIndex].filter(
      x => x === credential.id.toString(),
    );
  }

  async removeEntry(entryIndex: number): Promise<StringArray> {
    const list = this.getCredentialsList(entryIndex, false);
    if (!list) {
      return [];
    }

    /* Clear files and remove inde */
    this.pruneFiles(list);
    delete this._credentials[entryIndex];

    return list;
  }

  /* Prune all stored files */
  async pruneFiles(list: StringArray) {
    for (const token of list) {
      const rawCredential = await this.redisService.client.GET(token);
      if (!rawCredential) {
        continue;
      }

      const credential = new Credential(JSON.parse(rawCredential));
      for (const file of credential.uploaded_files) {
        await unlink(path.join(this.storageDirectory, file.id));
      }

      await this.redisService.client.DEL(token);
    }
  }

  clearEntries() {
    this._credentials = {};
  }

  getCredentialsList(
    entryIndex: number,
    createNew: boolean,
  ): StringArray | undefined {
    let list = this._credentials[entryIndex];
    if (!list && createNew) {
      list = this._credentials[entryIndex] = [];
    }
    return list;
  }

  get credentials(): Readonly<Credentials> {
    return this._credentials;
  }

  constructor(
    @inject(REDIS_SERVICE) private redisService: RedisService,
    @inject(STORAGE_DIRECTORY) private storageDirectory: string,
    @inject(CREDENTIAL_MANAGER_SERVICE_CONFIG)
    private configs: CredentialManagerServiceConfig,
  ) {
    this._credentials = {};
  }

  private _credentials: Credentials = {};
}
