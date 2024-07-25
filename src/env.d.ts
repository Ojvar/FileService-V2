declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';

    REDIS_URL: string;
    REDIS_USERNAME: string;
    REDIS_PASSWORD: string;
    REDIS_NAME: string;
    REDIS_DATABASE: string;
    REDIS_SOCKET_HOST: string;
    REDIS_SOCKET_PORT: string;
    REDIS_EXPIER_TIME: string;

    SENTRY_DSN: string;
    SENTRY_SAMPLE_RATE: string;
    SENTRY_PROFILES_SAMPLE_RATE: string;

    FILE_STORAGE_DB_URL: string;
    FILE_STORAGE_DB_HOST: string;
    FILE_STORAGE_DB_PORT: string;
    FILE_STORAGE_DB_USER: string;
    FILE_STORAGE_DB_PASSWORD: string;
    FILE_STORAGE_DB_DATABASE: string;

    FILE_STORAGE: string;
    MAX_FILE_SIZE: string;

    PRUNE_EXPIRED_CREDENTIALS_CRON_TIME: string;
    CREDENTIAL_MANAGER_BUCKET_INTERVAL: string;

    KEYCLOAK_ALLOWED_LIST: string;
    KEYCLOAK_REJECTED_LIST: string;
  }
}
