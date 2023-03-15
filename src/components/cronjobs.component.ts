import {
  Component,
  ContextTags,
  CoreBindings,
  createBindingFromClass,
  inject,
} from '@loopback/core';
import {RestApplication} from '@loopback/rest';
import {
  PruneExpiredCredentialsCronJob,
  PRUNE_EXPIRED_CREDENTIALS_CRONJOB,
} from '../crontabs';

export class CronJobComponent implements Component {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    private application: RestApplication,
  ) {
    application.add(
      createBindingFromClass(PruneExpiredCredentialsCronJob, {
        [ContextTags.KEY]: PRUNE_EXPIRED_CREDENTIALS_CRONJOB,
      }),
    );
  }
}
