import { testQueue } from "./queues";

export const addTestJob = async (): Promise<void> => {
  await testQueue.add("test-job", {
    message: "Hello from BullMQ",
    createdAt: new Date().toISOString(),
  });

  console.log("Test job added to queue");
};