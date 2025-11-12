import { Connection, Client } from '@temporalio/client';

export async function getTemporalClient() {
  const connection = await Connection.connect();
  return new Client({ connection });
}
