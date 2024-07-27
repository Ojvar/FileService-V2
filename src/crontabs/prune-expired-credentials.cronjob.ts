import {BindingKey, BindingScope, ContextTags, inject} from '@loopback/core';
import {CronJob, cronJob} from '@loopback/cron';
import {FileManagerService} from '../services';

export type PruneExpiredCredentialsCronJobConfig = {
  cronTime: string;
};

@cronJob({
  scope: BindingScope.APPLICATION,
  tags: {
    [ContextTags.KEY]: 'PruneExpiredCredentialsCronJob',
    [ContextTags.NAMESPACE]: 'cronjobs',
  },
})
export class PruneExpiredCredentialsCronJob extends CronJob {
  static BINDING_KEY = BindingKey.create<PruneExpiredCredentialsCronJob>(
    `cronjobs.${PruneExpiredCredentialsCronJob.name}`,
  );
  static CONFIG_BINDING_KEY =
    BindingKey.create<PruneExpiredCredentialsCronJobConfig>(
      `cronjobs.config.${PruneExpiredCredentialsCronJob.name}`,
    );

  constructor(
    @inject(PruneExpiredCredentialsCronJob.CONFIG_BINDING_KEY)
    configs: PruneExpiredCredentialsCronJobConfig,
    @inject(FileManagerService.BINDING_KEY)
    fileManagerService: FileManagerService,
  ) {
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
