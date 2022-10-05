import {
  BindingKey,
  /* inject, */ BindingScope,
  injectable,
} from '@loopback/core';
import {Token} from '../models';
import {StringArray} from '../types';

@injectable({scope: BindingScope.TRANSIENT})
export class TokenService {
  private tokens: Record<number, StringArray> = {};

  async addToken(token: Token) {
    const entryIndex = Math.ceil(token.expire_time / C_BUCKET_INTERVAL);
    const list = this.getTokensList(entryIndex, true);
    list.push(token.id);
  }

  async removeToken(token: Token) {
    const entryIndex = Math.ceil(token.expire_time / C_BUCKET_INTERVAL);
    if (!this.tokens[entryIndex]) {
      return;
    }
    this.tokens[entryIndex] = this.tokens[entryIndex].filter(
      x => x !== token.id,
    );
  }

  async removeEntry(entryIndex: number): Promise<StringArray> {
    const list = this.getTokensList(entryIndex);
    if (!list) {
      delete this.tokens[entryIndex];
      return list;
    }
    return [];
  }

  getTokensList(entryIndex: number, createNewEntry: boolean = false) {
    const list = this.tokens[entryIndex];
    if (list) {
      return list;
    }
    if (createNewEntry) {
      this.tokens[entryIndex] = [];
    }
    return [];
  }

  clearEntries() {
    this.tokens = {};
  }

  constructor() {
    this.tokens = {};
  }
}

export type TokenEntry = {
  expire_at: number;
  token: string;
};
export type TokenEntries = TokenEntry[];
export const C_BUCKET_INTERVAL = 300_000; /* 5 Minutes */
export const TOKEN_SERVICE = BindingKey.create<TokenService>(
  'services.TokenService',
);
