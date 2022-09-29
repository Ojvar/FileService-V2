// Copyright Ojvar <MOjvar.AmirHossein@Gmail.com> 2022. All Rights Reserved.
// Node module: file-service
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Client, expect} from '@loopback/testlab';
import {FileServiceApplication} from '../..';
import {FILE_SERVICE_KEYS} from '../../keys';
import {setupApplication} from './test-helper';

describe('PingController', () => {
  let app: FileServiceApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });
  after(async () => {
    await app.stop();
  });

  it('check redis is connected to server', async () => {
    const redisService = app.getSync(FILE_SERVICE_KEYS.REDIS_SERVICE);
    const {isOpen} = redisService;
    expect(isOpen).equal(true);
  });
});
