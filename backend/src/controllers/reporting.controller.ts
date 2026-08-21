import { Request, Response, NextFunction } from "express";
import { reportingService, ReportingService } from "../services/reporting.service.js";
import { BadRequestError } from "../utils/app-error.js";

export class ReportingController {
  constructor(
    private readonly service: ReportingService = reportingService
  ) {}

  // GET /api/reports/dashboard
  getDashboardMetrics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        throw new BadRequestError("User authentication required");
      }

      const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
      const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

      const data = await this.service.getDashboardMetrics(
        user,
        projectId,
        startDate,
        endDate
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/reports/export (or /api/tickets/export)
  exportCsv = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        throw new BadRequestError("User authentication required");
      }

      const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
      const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

      const csvData = await this.service.exportTicketsCsv(
        user,
        projectId,
        startDate,
        endDate
      );

      const filename = `tickets_report_${new Date().toISOString().split("T")[0]}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/reports/export-pdf
  exportPdf = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        throw new BadRequestError("User authentication required");
      }

      const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
      const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

      const htmlContent = await this.service.exportStyledReport(
        user,
        projectId,
        startDate,
        endDate
      );

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(htmlContent);
    } catch (error) {
      next(error);
    }
  };
}

export const reportingController = new ReportingController();
