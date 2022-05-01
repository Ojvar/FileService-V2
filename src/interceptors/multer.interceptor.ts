import {
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

@injectable({tags: {key: MulterInterceptor.BINDING_KEY}})
export class MulterInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${MulterInterceptor.name}`;

  constructor(@config() private options: multer.Options = {}) {
    if (!this.options.storage) {
      this.options.storage = multer.memoryStorage();
    }
  }

  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    const req = invocationCtx.getSync(RestBindings.Http.REQUEST);
    const res = invocationCtx.getSync(RestBindings.Http.RESPONSE);

    return new Promise((resolve, reject) => {
      multer(this.options).any()(req, res, () => {
        resolve(next());
      });
    });
  }
}
