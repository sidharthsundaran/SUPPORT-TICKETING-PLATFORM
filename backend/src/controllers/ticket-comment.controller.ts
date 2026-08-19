import { Request, Response, NextFunction } from "express";
import {
  ticketCommentService,
  TicketCommentService,
} from "../services/ticket-comment.service.js";

export class TicketCommentController {
  constructor(
    private readonly service: TicketCommentService = ticketCommentService
  ) {}

  // POST /api/tickets/:ticketId/comments
  createComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const ticketId = req.params.ticketId || req.params.id;
      const { type = "comment", content } = req.body;

      const comment = await this.service.createComment({
        ticketId,
        authorId: req.user._id.toString(),
        isPlatformAdmin: req.user.isPlatformAdmin,
        type,
        content,
      });

      res.status(201).json({
        success: true,
        message: type === "internal_note" ? "Internal note added" : "Comment posted",
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/tickets/:ticketId/comments
  getComments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const ticketId = req.params.ticketId || req.params.id;

      const comments = await this.service.getTicketComments(
        ticketId,
        req.user._id.toString(),
        req.user.isPlatformAdmin
      );

      res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const ticketCommentController = new TicketCommentController();

export const createComment = ticketCommentController.createComment;
export const getComments = ticketCommentController.getComments;
