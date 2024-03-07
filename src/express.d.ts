/* eslint-disable @typescript-eslint/naming-convention */
declare type JWT_USER = {
  [key: string]: unknown;
};

declare namespace Express {
  export interface Request {
    kauth: JWT_USER;
  }
}
