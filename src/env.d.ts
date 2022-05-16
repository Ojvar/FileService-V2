declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;

    SERVER_URL: string;
    BASE_PATH: string;
    HTTPS: string;
    SSL_KEY: string;
    SSL_CERT: string;

    REDIS_URL: string;
    REDIS_USERNAME: string;
    REDIS_PASSWORD: string;
    REDIS_NAME: string;
    REDIS_DATABASE: number;
    REDIS_SOCKET_HOST: string;
    REDIS_SOCKET_PORT: number;

    RABBITMQ_PROTOCOL: string;
    RABBITMQ_HOST: string;
    RABBITMQ_PORT: string;
    RABBITMQ_USER: string;
    RABBITMQ_PASS: string;
    RABBITMQ_VHOST: string;

    FILE_STORAGE_DB_URL: string;
    FILE_STORAGE_DB_HOST: string;
    FILE_STORAGE_DB_PORT: number;
    FILE_STORAGE_DB_USER: string;
    FILE_STORAGE_DB_PASSWORD: string;
    FILE_STORAGE_DB_DATABASE: string;

    REQUEST_EXPIRE_MILISECONDS: number;

    MULTER_MAX_FILE_SIZE: number;
  }
}
