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
  MessageHandlerErrorBehavior,
  QueueComponent,
  RabbitmqBindings,
  RabbitmqComponent,
  RabbitmqComponentConfig,
} from 'loopback-rabbitmq';
import path from 'path';
import {RedisClientOptions} from 'redis';
import {RequestConfig} from './controllers';
import {FileService} from './keys';
import {MySequence} from './sequence';

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
    if (false === options.rest.apiExplorer.disabled) {
      this.configure(RestExplorerBindings.COMPONENT).to({path: '/explorer'});
      this.component(RestExplorerComponent);
    }

    /* Config */
    this.configApp(options);

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
  }

  configApp(options: ApplicationConfig) {
    this.onStart(async () => {
      await this.connectToRedis();
    });

    this.configure<RequestConfig>(FileService.TOKEN_CONTROLLER).to({
      requestExpireMiliSeconds: +process.env.REQUEST_EXPIRE_MILISECONDS,
    });

    this.configure<RedisClientOptions>(FileService.REDIS_SERVICE).to({
      url: process.env.REDIS_URL,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      name: process.env.REDIS_NAME,
      database: process.env.REDIS_DATABASE,
      socket: {
        port: +(process.env.REDIS_SOCKET_PORT ?? '6379'),
        host: process.env.REDIS_SOCKET_HOST ?? 'localhost',
      },
    });

    this.configure<RabbitmqComponentConfig>(RabbitmqBindings.COMPONENT).to({
      options: {
        protocol: process.env.RABBITMQ_PROTOCOL,
        hostname: process.env.RABBITMQ_HOST,
        port: +(process.env.RABBITMQ_PORT ?? '5672'),
        username: process.env.RABBITMQ_USER,
        password: process.env.RABBITMQ_PASS,
        vhost: process.env.RABBITMQ_VHOST,
      },
      producer: {idleTimeoutMillis: 10000},
      consumer: {retries: 0, interval: 1500},
      defaultConsumerErrorBehavior: MessageHandlerErrorBehavior.ACK,
      prefetchCount: 1,
      // exchanges: [AuthKeys.RmqExchanges.QENG_AUTH],
    });

    this.component(RabbitmqComponent);
    this.booters(ConsumersBooter);
    this.component(QueueComponent);
  }

  async connectToRedis() {
    const service = this.getSync(FileService.REDIS_SERVICE);
    await service.connect();
  }
}
