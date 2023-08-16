/* eslint-disable @typescript-eslint/naming-convention */
import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {ObjectId} from 'bson';
import {REDIS_SERVICE, RedisService} from '../lib-redis/src';
import {Credential} from '../models';
import {StringArray} from '../types';
import {FILE_SERVICE, FileService} from './file.service';

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
  constructor(
    @inject(REDIS_SERVICE) private redisService: RedisService,
    @inject(FILE_SERVICE) private fileService: FileService,
    @inject(CREDENTIAL_MANAGER_SERVICE_CONFIG)
    private configs: CredentialManagerServiceConfig,
  ) {}

  async pruneLastExpiredEntry() {
    const lastEntryTime = +new Date() - this.configs.bucketInterval;
    return this.removeEntry(lastEntryTime);
  }

  async addCredential(credential: Credential) {
    return this.redisService.client.SADD(
      this.getRedisKey(credential.expire_time),
      credential.getKey(),
    );
  }

  async removeCredential(credential: Credential, removeFiles: boolean) {
    const redisKey = credential.getKey();
    return Promise.all([
      this.redisService.client.SREM(
        this.getRedisKey(credential.expire_time),
        redisKey,
      ),
      this.redisService.client.DEL(redisKey),
      removeFiles ? this.removeFilesFromDisk(credential) : undefined,
    ]);
  }

  async removeEntry(entryIndex: number) {
    const redisKey = this.getRedisKey(entryIndex);
    const tokens = await this.redisService.client.SMEMBERS(redisKey);
    await this.pruneFiles(tokens);
    return this.redisService.client.DEL(redisKey);
  }

  /* Prune all stored files */
  async pruneFiles(list: StringArray) {
    for (const token of list) {
      const rawCredential = await this.redisService.client.GET(token);
      if (!rawCredential) {
        continue;
      }
      const credential = new Credential(JSON.parse(rawCredential));
      await this.removeFilesFromDisk(credential);
      await this.redisService.client.DEL(token);
    }
  }

  async removeFilesFromDisk(credential: Credential) {
    for (const file of credential.uploaded_files) {
      this.fileService.deleteFile(file.id);
    }
  }

  async clearEntries() {
    const redisKey = this.getRedisAllKey();
    const items = await this.redisService.client.KEYS(redisKey);
    for (const item in items) {
      await this.redisService.client.DEL(item);
    }
  }

  async getCredentialsList(
    entryIndex: number,
  ): Promise<StringArray | undefined> {
    const redisKey = this.getRedisKey(entryIndex);
    return this.redisService.client.SMEMBERS(redisKey);
  }

  private getRedisAllKey(): string {
    return `entries_*`;
  }

  private getRedisKey(date: number): string {
    const entryIndex = this.getEntry(date);
    return `entries_${entryIndex}`;
  }

  private getEntry(timeStamp: number): number {
    return Math.ceil(timeStamp / this.configs.bucketInterval);
  }
}
