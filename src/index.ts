import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {
  FileServiceApplication,
  FileServiceApplicationConfig,
} from './application';
import {MessageHandlerErrorBehavior} from './loopback-rabbitmq/src';

export * from './application';

export async function main(options: FileServiceApplicationConfig) {
  const app = new FileServiceApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

export function loadEnv(envFile: string) {
  envFile = path.resolve(envFile);
  if (!fs.existsSync(envFile)) {
    console.warn('Env file not found! ', envFile);
    return;
  }
  const envData = dotenv.parse(fs.readFileSync(envFile));
  for (const data in envData) {
    process.env[data] = envData[data];
  }
}

export function getApplicationConfig(
  envFile?: string,
): FileServiceApplicationConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttp = 'false' === (process.env.HTTPS ?? 'false').toLowerCase();

  loadEnv(envFile ?? (isProduction ? '.env' : '.env.dev'));

  // Run the application
  return {
    rest: {
      expressSettings: {
        'x-powered-by': !isProduction,
        env: process.env.NODE_ENV ?? 'production',
      },
      apiExplorer: {disabled: isProduction},
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST,
      basePath: process.env.BASE_PATH ?? '',
      ...(isHttp
        ? {}
        : {
            protocol: 'https',
            key: process.env.SSL_KEY
              ? fs.readFileSync(path.resolve(process.env.SSL_KEY))
              : '',
            cert: process.env.SSL_CERT
              ? fs.readFileSync(path.resolve(process.env.SSL_CERT))
              : '',
          }),
      gracePeriodForClose: 5000,
      openApiSpec: {setServersFromRequest: true},
    },
    rabbitmqConfig: {
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
    },
    fileServiceDsConfig: {
      url: process.env.FILE_STORAGE_DB_URL,
      host: process.env.FILE_STORAGE_DB_HOST,
      port: +process.env.FILE_STORAGE_DB_PORT,
      user: process.env.FILE_STORAGE_DB_USER,
      password: process.env.FILE_STORAGE_DB_PASSWORD,
      database: process.env.FILE_STORAGE_DB_DATABASE,
    },
    redisConfig: {
      url: process.env.REDIS_URL,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      name: process.env.REDIS_NAME,
      database: process.env.REDIS_DATABASE,
      socket: {
        port: +(process.env.REDIS_SOCKET_PORT ?? '6379'),
        host: process.env.REDIS_SOCKET_HOST ?? 'localhost',
      },
    },
    keycloakBaseURL: process.env.KEYCLOAK_URL,
    maxFileSize: +(process.env.MAX_FILE_SIZE ?? '2097152'),
    rmqConfig: {
      requestExpireMiliSeconds: +process.env.REQUEST_EXPIRE_MILISECONDS,
    },
  };
}

if (require.main === module) {
  main(getApplicationConfig()).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
