import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
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

  async removeCredential(credential: Credential) {
    const redisKey = credential.getKey();
    return Promise.all([
      this.redisService.client.SREM(
        this.getRedisKey(credential.expire_time),
        redisKey,
      ),
      this.redisService.client.DEL(redisKey),
    ]);
  }

  async removeEntry(entryIndex: number) {
    const redisKey = this.getRedisKey(entryIndex);
    const tokens = await this.redisService.client.SMEMBERS(redisKey);
    this.pruneFiles(tokens);
    return this.redisService.client.DEL(redisKey);
  }

  /* Prune all stored files */
  async pruneFiles(list: StringArray) {
    for (const token of list) {
      /* Fetch redis data and try to parse it */
      const rawCredential = await this.redisService.client.GET(token);
      if (!rawCredential) {
        continue;
      }
      const credential = new Credential(JSON.parse(rawCredential));

      /* Remove file */
      for (const file of credential.uploaded_files) {
        await unlink(path.join(this.storageDirectory, file.id));
      }

      /* Remove credential from redis */
      await this.redisService.client.DEL(token);
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
  private getRedisKeyByEntryIndex(entryIndex: number | string): string {
    return `entries_${entryIndex}`;
  }
  private getEntry(timeStamp: number): number {
    return Math.ceil(timeStamp / this.configs.bucketInterval);
  }

  constructor(
    @inject(REDIS_SERVICE) private redisService: RedisService,
    @inject(STORAGE_DIRECTORY) private storageDirectory: string,
    @inject(CREDENTIAL_MANAGER_SERVICE_CONFIG)
    private configs: CredentialManagerServiceConfig,
  ) {}
}
