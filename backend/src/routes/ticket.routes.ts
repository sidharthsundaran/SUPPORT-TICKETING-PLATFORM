import { Router } from "express";

import {
  createTicket,
  getTicketById,
  getTicketByNumber,
  getProjectTickets,
  getMyTickets,
  getAssigneeTickets,
  searchTickets,
  updateTicket,
  updateStatus,
  assignTicket,
  archiveTicket,
  getTicketActivities,
  getPresignedUploadUrl,
  getEvidenceViewUrl,
  streamEvidenceFile,
  getTeamConsoleTickets,
  bulkUpdateTickets,
} from "../controllers/ticket.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

import {
  requireProjectMember,
  requireProjectStaff,
} from "../middleware/project.access.middleware.js";

import {
  requireTicketStaff,
  requireTicketManager,
  requireTicketAdmin,
} from "../middleware/ticket-authorization.middleware.js";

import {
  createComment,
  getComments,
} from "../controllers/ticket-comment.controller.js";

const router = Router();

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Read Operations
|--------------------------------------------------------------------------
*/

// Search tickets
router.get("/search", searchTickets);

// Current user's tickets
router.get("/my", getMyTickets);

// Ticket by number
router.get("/number/:ticketNumber", getTicketByNumber);

// Get evidence view URL / stream
router.get("/evidence-url", getEvidenceViewUrl);
router.get("/evidence-file", streamEvidenceFile);

// Ticket activities / history
router.get("/:ticketId/activity", getTicketActivities);

// Ticket comments / internal notes
router.get("/:ticketId/comments", getComments);
router.post("/:ticketId/comments", createComment);

// Ticket by ID
router.get("/:ticketId", getTicketById);

// Project tickets
router.get(
  "/project/:projectId",
  requireProjectMember,
  getProjectTickets
);

// Assignee tickets
router.get(
  "/assignee/:assigneeId",
  getAssigneeTickets
);

/*
|--------------------------------------------------------------------------
| Create & Upload
|--------------------------------------------------------------------------
*/

// Generate presigned upload URL for evidence files
router.post(
  "/upload-url",
  getPresignedUploadUrl
);

// Any authenticated user who is allowed to create a ticket
router.post(
  "/",
  createTicket
);

/*
|--------------------------------------------------------------------------
| Staff Operations
|--------------------------------------------------------------------------
*/

// Update ticket details
router.patch(
  "/:ticketId",
  requireTicketStaff,
  updateTicket
);

// Change ticket status
router.patch(
  "/:ticketId/status",
  requireTicketStaff,
  updateStatus
);

/*
|--------------------------------------------------------------------------
| Manager Operations
|--------------------------------------------------------------------------
*/

// Assign/reassign ticket
router.patch(
  "/:ticketId/assign",
  requireTicketManager,
  assignTicket
);

/*
|--------------------------------------------------------------------------
| Admin Operations
|--------------------------------------------------------------------------
*/

// Archive ticket
router.delete(
  "/:ticketId",
  requireTicketAdmin,
  archiveTicket
);

export default router;