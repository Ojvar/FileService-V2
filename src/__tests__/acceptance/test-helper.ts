import {Client, createRestAppClient} from '@loopback/testlab';
import {FileServiceApplication} from '../../application';
import {getApplicationConfig} from '../..';

export async function setupApplication(): Promise<AppWithClient> {
  const app = new FileServiceApplication(getApplicationConfig('.env.test'));
  await app.boot();
  await app.start();
  const client = createRestAppClient(app);
  return {app, client};
}

export interface AppWithClient {
  app: FileServiceApplication;
  client: Client;
}
