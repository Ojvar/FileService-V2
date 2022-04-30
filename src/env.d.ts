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

    REQUEST_EXPIRE_MILISECONDS: number;
  }
}
