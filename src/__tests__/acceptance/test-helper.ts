// Copyright Ojvar <MOjvar.AmirHossein@Gmail.com> 2022. All Rights Reserved.
// Node module: file-service
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  Client,
  createRestAppClient,
  givenHttpServerConfig,
} from '@loopback/testlab';
import {FileServiceApplication} from '../..';

export async function setupApplication(): Promise<AppWithClient> {
  const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    //
    // host: process.env.HOST,
    // port: +process.env.PORT,
  });

  const app = new FileServiceApplication({rest: restConfig});
  await app.boot();
  await app.start();
  /* TODO: BIND SERVCIES TO APPLICATION */
  const client = createRestAppClient(app);
  return {app, client};
}

export interface AppWithClient {
  app: FileServiceApplication;
  client: Client;
}
