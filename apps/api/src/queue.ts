import { Queue } from 'bullmq'; import IORedis from 'ioredis'; import { config } from './config.js';
export const connection = new IORedis(config.redisUrl, {maxRetriesPerRequest:null});
export const emailQueue = new Queue('email-send', {connection, defaultJobOptions:{attempts:5, backoff:{type:'exponential',delay:5000}, removeOnComplete:1000, removeOnFail:2000}});
export async function enqueueEmail(id:string, revision:number, scheduledAt:Date) { return emailQueue.add('send-email',{emailId:id,revision},{jobId:`email:${id}:${revision}`,delay:Math.max(0,scheduledAt.getTime()-Date.now())}); }
