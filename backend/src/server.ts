import "dotenv/config";

import app from "./app";
import connectDatabase from "./config/database";
import { addTestJob } from "./jobs/test-job";
import "./jobs/worker";
import { slaMonitoringService } from "./services/sla-monitoring.service.js";

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    slaMonitoringService.startMonitoring();
    await addTestJob();
  });
};

startServer();