declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';

    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_DB: string;
    REDIS_USERNAME: string;
    REDIS_PASSWORD: string;

    MONGO_HOST: string;
    MONGO_PORT: number;
    MONGO_DB: string;
    MONGO_URL: string;
    MONGO_USERNAME: string;
    MONGO_PASSWORD: string;

    FILE_STORAGE: string;
    MAX_FILE_SIZE: string;

    PRUNE_EXPIRED_CREDENTIALS_CRON_TIME: string;
    CREDENTIAL_MANAGER_BUCKET_INTERVAL: string;

    KEYCLOAK_ALLOWED_LIST: string;
    KEYCLOAK_REJECTED_LIST: string;
  }
}
