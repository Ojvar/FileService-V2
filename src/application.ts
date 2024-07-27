/* eslint-disable @typescript-eslint/naming-convention */
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import {join} from 'path';
import {
  KCAuthenticationComponent,
  KEYCLOAK_LOCAL_ACL,
  KeycloakAgentService,
  KeycloakComponent,
  KeycloakDataSource,
  KeycloakSequence,
} from './lib-keycloak/src';
import KeycloakJson from './keycloak.json';
import {SentryComponent, SentryInterceptor} from './lib-sentry/src';
import * as sentry from '@sentry/node';
import {
  FileStorageDataSource,
  FileStorageDataSourceConfig,
} from './datasources';
import {
  RedisClientOptions,
  RedisComponent,
  RedisService,
} from './lib-redis/src';
import {
  CredentialManagerService,
  CredentialManagerServiceConfig,
} from './services';
import {
  PruneExpiredCredentialsCronJob,
  PruneExpiredCredentialsCronJobConfig,
} from './crontabs';
import {CronComponent} from '@loopback/cron';
import {CronJobComponent} from './components';
import {FileHandlerInterceptor} from './interceptors';
import {Options as MulterOptions} from 'multer';

export {ApplicationConfig};

export type FileServiceApplicationConfig = ApplicationConfig & {
  sentryConfig: sentry.NodeOptions | undefined;
  keycloak: {
    allowedList: string;
    rejectedList: string;
  };
  storageDirectory: string;
  fileStorageDbConfig: FileStorageDataSourceConfig;
  credentialManagerConfig: CredentialManagerServiceConfig;
  pruneExpiredCredentialsCronJobConfig: PruneExpiredCredentialsCronJobConfig;
  redisConfig: RedisClientOptions;
  multerOptions: MulterOptions;
};

export class FileServiceApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: FileServiceApplicationConfig) {
    super(options);

    // Set up default home page
    this.static('/', join(__dirname, '../public'));

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

    this.configApp(options);
  }

  configApp(options: FileServiceApplicationConfig) {
    // Sentry
    this.component(SentryComponent);
    this.bind(SentryInterceptor.CONFIG_BINDING_KEY).to({
      ...options.sentryConfig,
    });

    // Keycloak
    const splitRegex = new RegExp(/[,;\t\ ]/, 'g');
    this.bind(KEYCLOAK_LOCAL_ACL).to({
      rejected_roles: options.keycloak.rejectedList
        .split(splitRegex)
        .filter(x => !!x),
      allowed_roles: options.keycloak.allowedList
        .split(splitRegex)
        .filter(x => !!x),
    });
    this.bind(KeycloakDataSource.CONFIG_BINDING_KEY).to({
      baseURL: KeycloakJson['auth-server-url'],
    });
    this.bind(KeycloakAgentService.CONFIG_BINDING_KEY).to({
      realm: KeycloakJson.realm,
      clientId: KeycloakJson.resource,
      clientSecret: KeycloakJson.credentials.secret,
    });
    this.component(KCAuthenticationComponent);
    this.component(KeycloakComponent);
    this.sequence(KeycloakSequence);

    // Redis
    this.component(RedisComponent);
    this.bind(RedisService.CONFIG_BINDING_KEY).to(options.redisConfig);

    // File Storage DataSource
    this.bind(FileStorageDataSource.CONFIG_BINDING_KEY).to(
      options.fileStorageDbConfig,
    );

    // ConfigCredentialManager
    this.bind(CredentialManagerService.CONFIG_BINDING_KEY).to(
      options.credentialManagerConfig,
    );

    // CronJob
    this.component(CronComponent);
    this.component(CronJobComponent);
    this.bind(PruneExpiredCredentialsCronJob.CONFIG_BINDING_KEY).to(
      options.pruneExpiredCredentialsCronJobConfig,
    );

    // configMulter() {
    this.bind(FileHandlerInterceptor.STORAGE_DIRECTORY).to(
      options.storageDirectory,
    );
    this.configure(FileHandlerInterceptor.BINDING_KEY).to(
      options.multerOptions,
    );
  }
}
