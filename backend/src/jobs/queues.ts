import { Queue } from "bullmq";
import redisConnection from "../config/redis";

export const testQueue = new Queue("test-queue", {
  connection: redisConnection,
});