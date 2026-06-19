import { Queue } from "bullmq";
import {redis} from './redis.js'

export const metricsQueue = new Queue("rag-metrics",{
    connection:redis
})
