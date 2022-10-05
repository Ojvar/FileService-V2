import {BindingKey, BindingScope, ContextTags} from '@loopback/core';
import {CronJob, cronJob} from '@loopback/cron';

@cronJob({
  scope: BindingScope.TRANSIENT,
  tags: {
    [ContextTags.KEY]: 'PruneExpiredCredentialsCronJob',
    [ContextTags.NAMESPACE]: 'cronjobs',
  },
})
export class PruneExpiredCredentialsCronJob extends CronJob {
  constructor() {
    super({
      name: PruneExpiredCredentialsCronJob.name,
      cronTime: CRONJOB_INTERVAL,
      start: true,
      onTick: () => {
        console.log('this is triggred');
      },
    });
  }
}

export const PRUNE_EXPIRED_CREDENTIALS_CRONJOB =
  BindingKey.create<PruneExpiredCredentialsCronJob>(
    'cronjobs.PruneExpiredCredentialsCronJob',
  );

/* TODO: THIS SHOULD BE LOADED FROM .ENV */
/* EVERY 5 MINUTES */
export const CRONJOB_INTERVAL = `0 */5 * * * *`;
