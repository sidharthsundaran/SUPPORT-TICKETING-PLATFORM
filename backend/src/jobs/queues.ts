import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

export const testQueue = new Queue("test-queue", {
  connection: redisConnection,
});

export const notificationQueue = new Queue("notification-queue", {
  connection: redisConnection,
});