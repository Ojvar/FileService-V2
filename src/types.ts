/* eslint-disable @typescript-eslint/naming-convention */
export type { RequestHandler as FileUploadHandler } from 'express-serve-static-core';

export namespace COMMON_TYPES {
  export type RMQExchanges = Record<
    string,
    {
      type: 'topic' | 'fanout' | 'direct' | string;
      name: string;
      route_key: string;
      queues: Record<string, { name: string; route_key: string }>;
    }
  >;

  export type MongoDataSourceConfig = {
    url: string;
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };

  export type RestDataSourceConfig = {
    name: string;
    connector: string;
    baseURL: string;
    crud: boolean;
    operations?: unknown[];
  };

  export type UserInfo = Record<string, unknown> & {
    sub: string;
    email_verified: boolean;
    name: string;
    preferred_username: string;
    given_name: string;
    family_name: string;
    email: string;
  };
}

export namespace FILE_SERVICE_TYPES {
  export type FileItemDetail = {
    id: string;
    fieldname: string;
    originalname: string;
    mimetype: string;
    size: number;
    filename: string;
    path: string;
  };

  export type FileItem = Record<string, FileItemDetail>;

  export type FileServiceDataSourceConfig = {
    baseURL: string;
  };
}
