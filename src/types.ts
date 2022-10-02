import {RequestHandler} from 'express-serve-static-core';

export type StringArray = string[];
export type ExpireTime = number | null;
export type FileUploadHandler = RequestHandler;

export namespace FILE_MANAGER_TYPES {}
