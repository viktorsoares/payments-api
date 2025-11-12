import { Worker } from '@temporalio/worker';
import * as activities from '../src/activities/paymentActivities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('../src/workflows/payment.workflow'),
    activities,
    taskQueue: 'payments',
  });
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
