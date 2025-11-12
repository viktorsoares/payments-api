import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from '../src/activities/paymentActivities';

async function run() {
  const connection = await NativeConnection.connect({
    address: 'temporal:7233',
  });

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('../src/workflows/payment.workflow'),
    activities,
    taskQueue: 'payments',
  });

  console.log(' Worker conectado e aguardando tarefas...');
  await worker.run();
}

run().catch((err) => {
  console.error(' Erro ao iniciar o worker:', err);
  process.exit(1);
});
