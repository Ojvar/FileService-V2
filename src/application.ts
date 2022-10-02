// Copyright Ojvar <MOjvar.AmirHossein@Gmail.com> 2022. All Rights Reserved.
// Node module: file-service
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
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
import {FILE_SERVICE_KEYS} from './keys';
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
    this.configure(RestExplorerBindings.COMPONENT).to({path: '/explorer'});
    this.component(RestExplorerComponent);

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

    this.configApp();
  }

  configApp() {
    this.configMulter();

    /* Bind Redis Configuration */
    this.bind(FILE_SERVICE_KEYS.REDIS_SERVICE_CONFIG).to({
      socket: {
        host: process.env.host ?? 'localhost',
        port: +(process.env.port ?? '6379'),
      },
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      database: +(process.env.REDIS_DB ?? '0'),
    });
  }

  configMulter() {
    const destination = path.resolve(
      process.env.FILE_STORAGE || path.resolve('.sandbox'),
    );
    console.log(destination);
    this.bind(FILE_SERVICE_KEYS.STORAGE_DIRECTORY).to(destination);

    const multerOptions: multer.Options = {
      limits: {fileSize: +(process.env.MAX_FILE_SIZE ?? '2097152')},
      storage: multer.diskStorage({
        destination,
        filename: (req, file, cb) => {
          cb(null, new ObjectId().toHexString());
        },
      }),
    };
    this.configure(FILE_SERVICE_KEYS.FILE_UPLOAD_SERVICE).to(multerOptions);
  }
}
