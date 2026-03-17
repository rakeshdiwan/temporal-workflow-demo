import { Connection, Client } from '@temporalio/client';

let clientPromise: Promise<Client> | undefined;

export async function getTemporalClient(): Promise<Client> {
  if (!clientPromise) {
    const address = process.env.TEMPORAL_ADDRESS || 'temporal:7233';
    const connection = await Connection.connect({ address });
    clientPromise = Promise.resolve(new Client({ connection }));
  }
  return clientPromise;
}

