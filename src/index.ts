import dotenv from 'dotenv';
import path, {resolve} from 'path';
import fs from 'fs';
import {
  FileServiceApplication,
  FileServiceApplicationConfig,
} from './application';
import {nodeProfilingIntegration} from '@sentry/profiling-node';
import {diskStorage} from 'multer';
import {ObjectId} from 'bson';

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
  const destination = resolve(process.env.FILE_STORAGE || resolve('.sandbox'));

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
    sentryConfig: {
      integrations: [nodeProfilingIntegration()],
      dsn: process.env.SENTRY_DSN,
      sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE ?? '0.3'),
      profilesSampleRate: parseFloat(
        process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.3',
      ),
    },
    keycloak: {
      allowedList: process.env.KEYCLOAK_ALLOWED_LIST ?? '',
      rejectedList: process.env.KEYCLOAK_REJECTED_LIST ?? '',
    },
    engineerProfileDsConfig: {
      baseURL: process.env.ENGINEER_PROFILE_SERVICE_URL,
    },
    redisConfig: {
      url: process.env.REDIS_URL,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      name: process.env.REDIS_NAME,
      database: +process.env.REDIS_DATABASE,
      socket: {
        port: +(process.env.REDIS_SOCKET_PORT ?? '6379'),
        host: process.env.REDIS_SOCKET_HOST ?? 'localhost',
      },
    },
    fileStorageDbConfig: {
      url: process.env.FILE_STORAGE_DB_URL,
      database: process.env.FILE_STORAGE_DB_DB,
      user: process.env.FILE_STORAGE_DB_USERNAME,
      password: process.env.FILE_STORAGE_DB_PASSWORD,
      host: process.env.FILE_STORAGE_DB_HOST,
      port: +process.env.FILE_STORAGE_DB_PORT,
    },
    credentialManagerConfig: {
      bucketInterval: +process.env.CREDENTIAL_MANAGER_BUCKET_INTERVAL * 1000,
    },
    pruneExpiredCredentialsCronJobConfig: {
      cronTime: process.env.PRUNE_EXPIRED_CREDENTIALS_CRON_TIME,
    },
    storageDirectory: destination,
    multerOptions: {
      limits: {fileSize: +(process.env.MAX_FILE_SIZE ?? '2097152')},
      storage: diskStorage({
        destination,
        filename: (_req: unknown, _file: unknown, cb: Function) =>
          cb(null, new ObjectId().toHexString()),
      }),
    },
  };
}

if (require.main === module) {
  main(getApplicationConfig()).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
