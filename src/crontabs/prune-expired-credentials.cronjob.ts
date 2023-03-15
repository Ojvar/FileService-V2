import {BindingKey, BindingScope, ContextTags, inject} from '@loopback/core';
import {CronJob, cronJob} from '@loopback/cron';
import {FileManagerService, FILE_MANAGER_SERVICE} from '../services';

import debugFactory from 'debug';
const trace = debugFactory('file-service::PruneExpiredCredentialsCronJob');

export type PruneExpiredCredentialsCronJobConfig = {
  cronTime: string;
};
export const PRUNE_EXPIRED_CREDENTIALS_CRONJOB =
  BindingKey.create<PruneExpiredCredentialsCronJob>(
    'cronjobs.PruneExpiredCredentialsCronJob',
  );
export const PRUNE_EXPIRED_CREDENTIALS_CRONJOB_CONFIG =
  BindingKey.create<PruneExpiredCredentialsCronJobConfig>(
    'cronjobs.config.PruneExpiredCredentialsCronJob',
  );

@cronJob({
  scope: BindingScope.TRANSIENT,
  tags: {
    [ContextTags.KEY]: 'PruneExpiredCredentialsCronJob',
    [ContextTags.NAMESPACE]: 'cronjobs',
  },
})
export class PruneExpiredCredentialsCronJob extends CronJob {
  constructor(
    @inject(PRUNE_EXPIRED_CREDENTIALS_CRONJOB_CONFIG)
    private configs: PruneExpiredCredentialsCronJobConfig,
    @inject(FILE_MANAGER_SERVICE)
    private fileManagerService: FileManagerService,
  ) {
    trace(configs);
    super({
      name: PruneExpiredCredentialsCronJob.name,
      cronTime: configs.cronTime,
      start: true,
      onTick: () => {
        fileManagerService.pruneExpiredCredentials().catch(console.error);
      },
    });
  }
}
