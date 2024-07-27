import {
  Component,
  ContextTags,
  CoreBindings,
  createBindingFromClass,
  inject,
} from '@loopback/core';
import {RestApplication} from '@loopback/rest';
import {PruneExpiredCredentialsCronJob} from '../crontabs';

export class CronJobComponent implements Component {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE) private app: RestApplication,
  ) {
    this.app.add(
      createBindingFromClass(PruneExpiredCredentialsCronJob, {
        [ContextTags.KEY]: PruneExpiredCredentialsCronJob.BINDING_KEY,
      }),
    );
  }
}
