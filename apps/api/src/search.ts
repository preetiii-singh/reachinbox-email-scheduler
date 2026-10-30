import { Client } from '@elastic/elasticsearch'; import { config } from './config.js';
export const es = new Client({node:config.elasticUrl});
export async function indexEmail(e:any) { try {await es.index({index:'emails',id:e.id,document:{...e, scheduled_at:new Date(e.scheduled_at).toISOString(), sent_at:e.sent_at && new Date(e.sent_at).toISOString()}});} catch(err){console.error('Elasticsearch index deferred:',(err as Error).message);} }
