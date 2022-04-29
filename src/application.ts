import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
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
      const service = this.getSync(FileService.REDIS_SERVICE);
      await service.connect();
    });

    this.configure<RequestConfig>(FileService.TOKEN_CONTROLLER).to({
      requestExpireSeconds: +process.env.REQUEST_EXPIRE_SECONDS,
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
  }
}
