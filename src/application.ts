import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import {
  ConsumersBooter,
  QueueComponent,
  RabbitmqBindings,
  RabbitmqComponent,
  RabbitmqComponentConfig,
} from './loopback-rabbitmq/src';
import multer from 'multer';
import path from 'path';
import {RedisClientOptions} from 'redis';
import {v4 as uuidV4} from 'uuid';
import {KCAuthenticationComponent, KeycloakComponent} from './components';
import {RequestConfig} from './controllers';
import {MulterInterceptor} from './interceptors';
import {COMMON_KEYS, FileService} from './keys';
import {MySequence} from './sequence';
import {COMMON_TYPES} from './types';
import {FileStorageDataSourceConfig} from './datasources';

export {ApplicationConfig};

export type FileServiceApplicationConfig = ApplicationConfig & {
  rabbitmqConfig: RabbitmqComponentConfig;
  fileServiceDsConfig: FileStorageDataSourceConfig;
  redisConfig: RedisClientOptions;
  keycloakBaseURL: string;
  maxFileSize: number;
  rmqConfig: RequestConfig;
};

export class FileServiceApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: FileServiceApplicationConfig) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({path: '/explorer'});
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      consumers: {
        dirs: ['consumers'],
        extensions: ['.consumer.js'],
        nested: true,
      },
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    this.configApp(options);
  }

  configApp(options: FileServiceApplicationConfig) {
    /* Config */
    this.onStart(async () => {
      this.bind(FileService.SERVER_URL).to(String(this.restServer.url));
      await this.connectToRedis();
    });

    this.component(KCAuthenticationComponent);
    this.component(KeycloakComponent);

    /* Setup keycloak wrapper */
    this.bind<Partial<COMMON_TYPES.RestDataSourceConfig>>(
      COMMON_KEYS.KEYCLOAK_DATASOURCE_CONFIG,
    ).to({baseURL: options.keycloakBaseURL});

    /* Set upload destination folder */
    const destination =
      options.destination ?? path.join(__dirname, '../.sandbox');
    this.bind(FileService.STORAGE_DIRECTORY).to(destination);
    const multerOptions: multer.Options = {
      limits: {fileSize: options.maxFileSize},
      storage: multer.diskStorage({
        destination,
        filename: (req, file, cb) => cb(null, uuidV4()),
      }),
    };
    this.configure(MulterInterceptor.BINDING_KEY).to(multerOptions);

    /* Redis Config */
    this.configure(FileService.REDIS_SERVICE).to(options.redisConfig);

    /* MongoDB */
    this.bind(FileService.DS_CONFIG_FILE_STORAGE).to(
      options.fileServiceDsConfig,
    );

    /* RabbitMQ */
    this.configure(RabbitmqBindings.COMPONENT).to(options.rabbitmqConfig);
    this.component(RabbitmqComponent);
    this.booters(ConsumersBooter);
    this.component(QueueComponent);

    /* RMQ Config */
    this.configure(FileService.TOKEN_CONTROLLER).to(options.rmqConfig);
  }

  async connectToRedis() {
    const service = this.getSync(FileService.REDIS_SERVICE);
    await service.connect();
  }
}
