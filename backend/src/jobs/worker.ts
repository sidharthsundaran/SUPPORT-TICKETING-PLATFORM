import { Worker } from "bullmq";
import redisConnection from "../config/redis";

const testWorker = new Worker(
  "test-queue",
  async (job) => {
    console.log("Processing job:", job.name);
    console.log("Job data:", job.data);

    return {
      success: true,
    };
  },
  {
    connection: redisConnection,
  }
);

testWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

testWorker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

export default testWorker;