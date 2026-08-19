import Ticket, { ITicket } from "../models/Ticket.js";
import TicketActivity from "../models/TicketActivity.js";
import { notificationService } from "./notification.service.js";

export class SlaMonitoringService {
  private intervalId: NodeJS.Timeout | null = null;

  startMonitoring(intervalMs: number = 60000): void {
    if (this.intervalId) return;

    console.log(`[SLA Monitoring] Background service started (interval: ${intervalMs}ms)`);
    
    // Initial run after 5 seconds
    setTimeout(() => this.checkSlaBreaches(), 5000);

    // Periodic check
    this.intervalId = setInterval(() => this.checkSlaBreaches(), intervalMs);
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[SLA Monitoring] Background service stopped");
    }
  }

  async checkSlaBreaches(): Promise<void> {
    try {
      const now = new Date();

      // Find active tickets that are not resolved or closed
      const activeTickets = await Ticket.find({
        status: { $nin: ["resolved", "closed", "rejected", "duplicate"] },
        isArchived: false,
      });

      for (const ticket of activeTickets) {
        // Skip if paused right now
        if (ticket.status === "awaiting_client_response" || ticket.slaClock?.pausedAt) {
          continue;
        }

        // 1. First Response SLA Breach check
        if (
          ticket.slaFirstResponseStatus === "pending" &&
          ticket.slaFirstResponseDueAt &&
          now > new Date(ticket.slaFirstResponseDueAt)
        ) {
          ticket.slaFirstResponseStatus = "breached";
          await ticket.save();
        }

        // 2. Resolution SLA Breach & Approaching Breach checks
        if (ticket.slaResolutionDueAt) {
          const dueAt = new Date(ticket.slaResolutionDueAt);
          const createdAt = new Date(ticket.createdAt);
          const totalDurationMs = dueAt.getTime() - createdAt.getTime();
          const totalPausedMs = ticket.slaClock?.totalPausedMs || 0;
          const elapsedMs = now.getTime() - createdAt.getTime() - totalPausedMs;

          // Check Actual Breach
          if (now > dueAt && ticket.slaResolutionStatus !== "breached") {
            ticket.slaResolutionStatus = "breached";
            await ticket.save();

            // Log immutable audit activity
            await TicketActivity.create({
              ticketId: ticket._id,
              actorId: ticket.requesterId, // System event
              action: "sla_breached",
              newValue: "SLA Resolution Deadline Breached",
              metadata: {
                dueAt,
                breachedAt: now,
              },
            });

            // Dispatch SLA Breach Notification (BR-NTF-008)
            await notificationService.dispatchSlaNotification(ticket, "sla_breached");
          }
          // Check Approaching Breach (75% elapsed)
          else if (
            elapsedMs >= 0.75 * totalDurationMs &&
            ticket.slaResolutionStatus === "within_sla"
          ) {
            ticket.slaResolutionStatus = "approaching_breach";
            await ticket.save();

            // Log warning activity
            await TicketActivity.create({
              ticketId: ticket._id,
              actorId: ticket.requesterId,
              action: "sla_warning",
              newValue: "SLA Resolution Approaching Breach (75% elapsed)",
              metadata: {
                dueAt,
                warningAt: now,
              },
            });

            // Dispatch SLA Warning Notification (BR-NTF-008)
            await notificationService.dispatchSlaNotification(ticket, "sla_warning");
          }
        }
      }
    } catch (err: any) {
      console.error("[SLA Monitoring Error]:", err?.message || err);
    }
  }
}

export const slaMonitoringService = new SlaMonitoringService();
