import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { emailService } from "../services/email.service.js";
import User from "../models/user.js";

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

// Helper to fetch user emails safely
async function getUserEmails(userArr: string[]): Promise<Record<string, { email: string; name: string }>> {
  const users = await User.find({ _id: { $in: userArr } }, "_id email name");
  const map: Record<string, { email: string; name: string }> = {};
  for (const u of users) {
    map[u._id.toString()] = { email: u.email, name: u.name };
  }
  return map;
}

export const notificationWorker = new Worker(
  "notification-queue",
  async (job) => {
    const { name, data } = job;

    switch (name) {
      case "notification.newTicket": {
        const {
          ticketId,
          ticketNumber,
          title,
          description,
          severity,
          module,
          requesterId,
          teamRecipientIds,
        } = data;

        const allUserIds = Array.from(new Set<string>([requesterId, ...teamRecipientIds]));
        const userMap = await getUserEmails(allUserIds);

        // 1. Team Notifications (BR-NTF-001, BR-NTF-002)
        if (teamRecipientIds.length > 0) {
          const teamInAppItems = teamRecipientIds.map((recId: string) => ({
            recipientId: recId,
            ticketId,
            type: "new_ticket_team" as const,
            title: `New Ticket #${ticketNumber}`,
            message: `${userMap[requesterId]?.name || "A client"} submitted ticket "${title}" (${severity.toUpperCase()})`,
            link: `/tickets/${ticketId}`,
          }));

          await notificationRepository.createMany(teamInAppItems);

          for (const teamId of teamRecipientIds) {
            const user = userMap[teamId];
            if (user?.email) {
              const html = emailService.renderHtmlTemplate(
                `New Ticket Submitted: #${ticketNumber}`,
                `<p>A new ticket has been submitted:</p>
                 <ul>
                   <li><strong>Ticket #:</strong> ${ticketNumber}</li>
                   <li><strong>Title:</strong> ${title}</li>
                   <li><strong>Severity:</strong> ${severity}</li>
                   <li><strong>Module:</strong> ${module}</li>
                   <li><strong>Summary:</strong> ${description.substring(0, 150)}...</li>
                 </ul>`,
                `${frontendUrl}/tickets/${ticketId}`,
                "View Ticket Details"
              );

              await emailService.sendEmail({
                to: user.email,
                subject: `[${ticketNumber}] New Ticket: ${title}`,
                html,
              });
            }
          }
        }

        // 2. Requester Submission Ack (BR-NTF-003)
        const requester = userMap[requesterId];
        if (requester) {
          await notificationRepository.create({
            recipientId: requesterId,
            ticketId,
            type: "submission_ack",
            title: `Ticket Created #${ticketNumber}`,
            message: `Your ticket "${title}" has been created successfully.`,
            link: `/tickets/${ticketId}`,
          });

          if (requester.email) {
            const html = emailService.renderHtmlTemplate(
              `Ticket Submission Received: #${ticketNumber}`,
              `<p>Hello ${requester.name},</p>
               <p>Your ticket <strong>#${ticketNumber}</strong> has been received and queued for triage.</p>
               <p><strong>Title:</strong> ${title}</p>`,
              `${frontendUrl}/tickets/${ticketId}`,
              "Track Ticket Progress"
            );

            await emailService.sendEmail({
              to: requester.email,
              subject: `[${ticketNumber}] Submission Received: ${title}`,
              html,
            });
          }
        }
        break;
      }

      case "notification.statusChange": {
        const { ticketId, ticketNumber, title, oldStatus, newStatus, requesterId } = data;
        const userMap = await getUserEmails([requesterId]);
        const requester = userMap[requesterId];

        if (requester) {
          await notificationRepository.create({
            recipientId: requesterId,
            ticketId,
            type: newStatus === "resolved" ? "ticket_resolved" : "status_changed",
            title: `Status Updated #${ticketNumber}`,
            message: `Ticket #${ticketNumber} changed from ${oldStatus.toUpperCase()} to ${newStatus.toUpperCase()}`,
            link: `/tickets/${ticketId}`,
          });

          if (requester.email) {
            const html = emailService.renderHtmlTemplate(
              `Ticket Status Update: #${ticketNumber}`,
              `<p>Hello ${requester.name},</p>
               <p>Your ticket <strong>#${ticketNumber}</strong> status has been updated to <strong>${newStatus.toUpperCase()}</strong>.</p>`,
              `${frontendUrl}/tickets/${ticketId}`,
              "View Ticket"
            );

            await emailService.sendEmail({
              to: requester.email,
              subject: `[${ticketNumber}] Status Changed to ${newStatus.toUpperCase()}: ${title}`,
              html,
            });
          }
        }
        break;
      }

      case "notification.assignment": {
        const { ticketId, ticketNumber, title, assigneeId } = data;
        const userMap = await getUserEmails([assigneeId]);
        const assignee = userMap[assigneeId];

        if (assignee) {
          await notificationRepository.create({
            recipientId: assigneeId,
            ticketId,
            type: "assignment",
            title: `Assigned Ticket #${ticketNumber}`,
            message: `You have been assigned ticket #${ticketNumber}: "${title}"`,
            link: `/tickets/${ticketId}`,
          });

          if (assignee.email) {
            const html = emailService.renderHtmlTemplate(
              `Ticket Assigned: #${ticketNumber}`,
              `<p>Hello ${assignee.name},</p>
               <p>You have been assigned to ticket <strong>#${ticketNumber}</strong>.</p>
               <p><strong>Title:</strong> ${title}</p>`,
              `${frontendUrl}/tickets/${ticketId}`,
              "Open Ticket Console"
            );

            await emailService.sendEmail({
              to: assignee.email,
              subject: `[${ticketNumber}] Assigned to you: ${title}`,
              html,
            });
          }
        }
        break;
      }

      case "notification.reply": {
        const { ticketId, ticketNumber, title, recipients, isRequesterReply } = data;
        const userMap = await getUserEmails(recipients);

        for (const recId of recipients) {
          const recUser = userMap[recId];
          if (recUser) {
            await notificationRepository.create({
              recipientId: recId,
              ticketId,
              type: isRequesterReply ? "requester_reply" : "comment_added",
              title: `New Comment #${ticketNumber}`,
              message: `A new response was posted on ticket #${ticketNumber}`,
              link: `/tickets/${ticketId}`,
            });

            if (recUser.email) {
              const html = emailService.renderHtmlTemplate(
                `New Comment on #${ticketNumber}`,
                `<p>Hello ${recUser.name},</p>
                 <p>A new comment was posted on ticket <strong>#${ticketNumber}</strong>.</p>`,
                `${frontendUrl}/tickets/${ticketId}`,
                "View Comment"
              );

              await emailService.sendEmail({
                to: recUser.email,
                subject: `[${ticketNumber}] New Comment: ${title}`,
                html,
              });
            }
          }
        }
        break;
      }

      case "notification.slaEvent": {
        const { ticketId, ticketNumber, title, eventType, recipients } = data;
        const userMap = await getUserEmails(recipients);

        const isWarning = eventType === "sla_warning";
        const subjectPrefix = isWarning ? "SLA Warning (75% Elapsed)" : "SLA BREACHED";

        for (const recId of recipients) {
          const recUser = userMap[recId];
          if (recUser) {
            await notificationRepository.create({
              recipientId: recId,
              ticketId,
              type: eventType === "sla_warning" ? "sla_warning" : "sla_breached",
              title: `${subjectPrefix} #${ticketNumber}`,
              message: `Ticket #${ticketNumber} "${title}" has triggered ${isWarning ? "an SLA warning" : "an SLA breach"}.`,
              link: `/tickets/${ticketId}`,
            });

            if (recUser.email) {
              const html = emailService.renderHtmlTemplate(
                `${subjectPrefix}: #${ticketNumber}`,
                `<p>Hello ${recUser.name},</p>
                 <p>Ticket <strong>#${ticketNumber}</strong> (${title}) has triggered <strong>${subjectPrefix}</strong>.</p>`,
                `${frontendUrl}/tickets/${ticketId}`,
                "View Ticket SLA Details"
              );

              await emailService.sendEmail({
                to: recUser.email,
                subject: `[${ticketNumber}] ${subjectPrefix}: ${title}`,
                html,
              });
            }
          }
        }
        break;
      }
    }

    return { success: true };
  },
  {
    connection: redisConnection,
  }
);

notificationWorker.on("completed", (job) => {
  console.log(`[Notification Worker] Job ${job.id} (${job.name}) completed`);
});

notificationWorker.on("failed", (job, error) => {
  console.error(`[Notification Worker] Job ${job?.id} failed:`, error.message);
});

export default notificationWorker;