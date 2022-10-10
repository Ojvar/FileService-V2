declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';

    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_DB: string;
    REDIS_USERNAME: string;
    REDIS_PASSWORD: string;

    FILE_STORAGE: string;
    MAX_FILE_SIZE: number;

    PRUNE_EXPIRED_CREDENTIALS_CRON_TIME: string;
    CREDENTIAL_MANAGER_BUCKET_INTERVAL: number;
  }
}
