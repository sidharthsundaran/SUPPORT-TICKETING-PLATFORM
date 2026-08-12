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
} from "../controllers/ticket.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

import { 
    requireProjectMember, 
    requireProjectStaff 
} from "../middleware/project.access.middleware.js";

const router = Router();

router.use(authMiddleware);

// Search
router.get("/search", searchTickets);

// Current user's tickets
router.get("/my", getMyTickets);

// Ticket by number
router.get("/number/:ticketNumber", getTicketByNumber);

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

// Create ticket
router.post(
  "/",
  createTicket
);

// Update ticket
router.patch(
  "/:ticketId",
  updateTicket
);

// Update status
router.patch(
  "/:ticketId/status",
  updateStatus
);

// Assign ticket
router.patch(
  "/:ticketId/assign",
  assignTicket
);

// Archive ticket
router.delete(
  "/:ticketId",
  archiveTicket
);

export default router;