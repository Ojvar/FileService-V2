// Copyright Ojvar <MOjvar.AmirHossein@Gmail.com> 2022. All Rights Reserved.
// Node module: file-service
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* eslint-disable @typescript-eslint/naming-convention */

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
import {diskStorage, Options} from 'multer';
import {join, resolve} from 'path';
import {CronJobComponent} from './components';
import {PRUNE_EXPIRED_CREDENTIALS_CRONJOB_CONFIG} from './crontabs';
import {FILE_STORAGE_DATASOURCE_CONFIG} from './datasources';
import {FileHandlerInterceptor, STORAGE_DIRECTORY} from './interceptors';
import {
  KCAuthenticationComponent,
  KeycloakComponent,
  KeycloakSequence,
  KEYCLOAK_AGENT_SERVICE_CONFIG,
  KEYCLOAK_DATASOURCE_CONFIG,
  KEYCLOAK_LOCAL_ACL,
} from './lib-keycloak/src';
import {RedisComponent, REDIS_SERVICE_CONFING} from './lib-redis/src';
import {CREDENTIAL_MANAGER_SERVICE_CONFIG} from './services';
import KeycloakJson from './keycloak.json';
import {SentryComponent, SENTRY_INTERCEPTOR_CONFIG} from './lib-sentry/src';

export {ApplicationConfig};

export class FileServiceApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up default home page
    this.static('/', join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    if (false === options.rest.apiExplorer.disabled) {
      this.configure(RestExplorerBindings.COMPONENT).to({path: '/explorer'});
      this.component(RestExplorerComponent);
    }

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    /* Config app */
    this.configSentry();
    this.configKeycloak();
    this.configCredentialManager();
    this.configCronJobs();
    this.configMulter();
    this.configRedis();
    this.configFileStorage();
  }

  configSentry() {
    const {SENTRY_DSN, SENTRY_SAMPLE_RATE} = process.env;
    this.bind(SENTRY_INTERCEPTOR_CONFIG).to({
      dsn: SENTRY_DSN,
      tracesSampleRate: parseFloat(SENTRY_SAMPLE_RATE ?? '1.0'),
      integrations: integrations =>
        integrations.filter(integration => integration.name !== 'Http'),
    });
    this.component(SentryComponent);
  }

  private configKeycloak() {
    const {KEYCLOAK_ALLOWED_LIST, KEYCLOAK_REJECTED_LIST} = process.env;
    const splitRegex = new RegExp(/[,;\t\ ]/, 'g');
    const allowed_roles = (KEYCLOAK_ALLOWED_LIST ?? '')
      .split(splitRegex)
      .filter(x => !!x);
    const rejected_roles = (KEYCLOAK_REJECTED_LIST ?? '')
      .split(splitRegex)
      .filter(x => !!x);

    this.bind(KEYCLOAK_LOCAL_ACL).to({rejected_roles, allowed_roles});
    this.bind(KEYCLOAK_DATASOURCE_CONFIG).to({
      baseURL: KeycloakJson['auth-server-url'],
    });
    this.bind(KEYCLOAK_AGENT_SERVICE_CONFIG).to({
      realm: KeycloakJson.realm,
      clientId: KeycloakJson.resource,
      clientSecret: KeycloakJson.credentials.secret,
    });

    this.component(KCAuthenticationComponent);
    this.component(KeycloakComponent);
    this.sequence(KeycloakSequence);
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
    const {PRUNE_EXPIRED_CREDENTIALS_CRON_TIME} = process.env;
    this.component(CronComponent);
    this.component(CronJobComponent);
    this.bind(PRUNE_EXPIRED_CREDENTIALS_CRONJOB_CONFIG).to({
      cronTime: PRUNE_EXPIRED_CREDENTIALS_CRON_TIME,
    });
  }

  private configRedis() {
    const {REDIS_HOST, REDIS_DB, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD} =
      process.env;
    this.bind(REDIS_SERVICE_CONFING).to({
      socket: {host: REDIS_HOST ?? 'localhost', port: +(REDIS_PORT ?? '6379')},
      username: REDIS_USERNAME,
      password: REDIS_PASSWORD,
      database: +(REDIS_DB ?? '0'),
    });
    this.component(RedisComponent);
  }

  configMulter() {
    const {FILE_STORAGE, MAX_FILE_SIZE} = process.env;
    const destination = resolve(FILE_STORAGE || resolve('.sandbox'));
    this.bind(STORAGE_DIRECTORY).to(destination);

    const multerOptions: Options = {
      limits: {fileSize: +(MAX_FILE_SIZE ?? '2097152')},
      storage: diskStorage({
        destination,
        filename: (_req: unknown, _file: unknown, cb: Function) =>
          cb(null, new ObjectId().toHexString()),
      }),
    };
    this.configure(FileHandlerInterceptor.BINDING_KEY).to(multerOptions);
  }
}
