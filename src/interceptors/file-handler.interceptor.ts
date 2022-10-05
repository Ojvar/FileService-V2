import {
  BindingKey,
  config,
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {RestBindings} from '@loopback/rest';
import multer from 'multer';

@injectable({tags: {key: FileHandlerInterceptor.BINDING_KEY}})
export class FileHandlerInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${FileHandlerInterceptor.name}`;

  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    const request = invocationCtx.getSync(RestBindings.Http.REQUEST);
    const response = invocationCtx.getSync(RestBindings.Http.RESPONSE);

    return new Promise((resolve, reject) =>
      multer(this.options).single('file')(request, response, () =>
        resolve(next()),
      ),
    );
  }

  constructor(@config() private options: multer.Options = {}) {
    if (!this.options.storage) {
      this.options.storage = multer.memoryStorage();
    }
  }
}

export const STORAGE_DIRECTORY = BindingKey.create<string>('storage.directory');
