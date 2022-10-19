// Copyright Ojvar <MOjvar.AmirHossein@Gmail.com> 2022. All Rights Reserved.
// Node module: file-service
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {CronComponent} from '@loopback/cron';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import {ObjectId} from 'bson';
import multer from 'multer';
import path from 'path';
import {CronJobComponent} from './components';
import {PRUNE_EXPIRED_CREDENTIALS_CRONJOB_CONFIG} from './crontabs';
import {FILE_STORAGE_DATASOURCE_CONFIG} from './datasources';
import {FileHandlerInterceptor, STORAGE_DIRECTORY} from './interceptors';
import {MySequence} from './sequence';
import {
  CREDENTIAL_MANAGER_SERVICE_CONFIG,
  REDIS_SERVICE_CONFIG,
} from './services';

export {ApplicationConfig};

export class FileServiceApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({path: '/explorer'});
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    this.configApp();
  }

  configApp() {
    this.configCredentialManager();
    this.configCronJobs();
    this.configMulter();
    this.configRedis();
    this.configFileStorage();
  }

  private configFileStorage() {
    const {
      MONGO_URL,
      MONGO_DB,
      MONGO_HOST,
      MONGO_PASSWORD,
      MONGO_PORT,
      MONGO_USERNAME,
    } = process.env;
    this.bind(FILE_STORAGE_DATASOURCE_CONFIG).to({
      database: MONGO_DB,
      url: MONGO_URL,
      host: MONGO_HOST,
      port: +MONGO_PORT,
      user: MONGO_USERNAME,
      password: MONGO_PASSWORD,
    });
  }

  private configCredentialManager() {
    const {CREDENTIAL_MANAGER_BUCKET_INTERVAL} = process.env;
    this.bind(CREDENTIAL_MANAGER_SERVICE_CONFIG).to({
      bucketInterval: +CREDENTIAL_MANAGER_BUCKET_INTERVAL * 1000,
    });
  }

  private configCronJobs() {
    this.component(CronComponent);
    this.component(CronJobComponent);

    const {PRUNE_EXPIRED_CREDENTIALS_CRON_TIME} = process.env;
    this.bind(PRUNE_EXPIRED_CREDENTIALS_CRONJOB_CONFIG).to({
      cronTime: PRUNE_EXPIRED_CREDENTIALS_CRON_TIME,
    });
  }

  private configRedis() {
    const {REDIS_HOST, REDIS_DB, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD} =
      process.env;
    this.bind(REDIS_SERVICE_CONFIG).to({
      socket: {host: REDIS_HOST ?? 'localhost', port: +(REDIS_PORT ?? '6379')},
      username: REDIS_USERNAME,
      password: REDIS_PASSWORD,
      database: +(REDIS_DB ?? '0'),
    });
  }

  configMulter() {
    const {FILE_STORAGE, MAX_FILE_SIZE} = process.env;
    const destination = path.resolve(FILE_STORAGE || path.resolve('.sandbox'));
    this.bind(STORAGE_DIRECTORY).to(destination);

    const multerOptions: multer.Options = {
      limits: {fileSize: +(MAX_FILE_SIZE ?? '2097152')},
      storage: multer.diskStorage({
        destination,
        filename: (req, file, cb) => cb(null, new ObjectId().toHexString()),
      }),
    };
    this.configure(FileHandlerInterceptor.BINDING_KEY).to(multerOptions);
  }
}
