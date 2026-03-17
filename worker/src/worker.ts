import { Worker, NativeConnection } from '@temporalio/worker';

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'temporal:7233'
  });

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'orders-task-queue',
    workflowsPath: require.resolve('./workflows/orderWorkflow'),
    activities: require('./activities/orderActivities')
  });

  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed', err);
  process.exit(1);
});

