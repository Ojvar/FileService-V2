// Copyright Ojvar <MOjvar.AmirHossein@Gmail.com> 2022. All Rights Reserved.
// Node module: file-service
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Client, expect} from '@loopback/testlab';
import {FileServiceApplication} from '../..';
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

  it('invokes GET /ping', async () => {
    const res = await client.get('/ping?msg=world').expect(200);
    expect(res.body).to.containEql({greeting: 'Hello from LoopBack'});
  });
});
