import cron from 'node-cron';

import { createBackup, ensureDailyBackup } from './backup.ts';

export function initScheduler(onRetrain: () => Promise<void>): void {
  // 1. Daily backup at 3:55 AM (5 minutes before retraining)
  cron.schedule('55 3 * * *', async () => {
    console.log('[Scheduler] Running scheduled daily backup at 3:55 AM...');
    await createBackup('daily');
  });

  // 2. Daily model retrain at 4:00 AM
  cron.schedule('0 4 * * *', async () => {
    console.log('[Scheduler] Running scheduled daily retrain at 4:00 AM...');
    try {
      await onRetrain();
    } catch (err) {
      console.error('[Scheduler] Scheduled daily retrain failed:', err);
    }
  });

  console.log('[Scheduler] Initialized cron schedules: Daily backup at 03:55, Retrain at 04:00.');
}

export { createBackup, ensureDailyBackup };
