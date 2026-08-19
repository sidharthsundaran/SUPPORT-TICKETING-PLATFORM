import React, { useState } from "react";
import {
  MessageSquare,
  Lock,
  Send,
  Loader2,
  AlertCircle,
  UserCheck,
  Building2,
} from "lucide-react";
import { useGetTicketCommentsQuery, useCreateTicketCommentMutation } from "../ticketApi";
import { TicketCommentType, TicketCommentAuthor } from "../types";
import { useAuth } from "../../../hooks/useAuth";

interface TicketCommentsProps {
  ticketId: string;
}

export const TicketComments: React.FC<TicketCommentsProps> = ({ ticketId }) => {
  const { isClient, isInternal, isPlatformAdmin, user } = useAuth();
  const isClientUser = isClient || user?.userType === "client";
  const canPostInternalNotes = !isClientUser && (isInternal || isPlatformAdmin || user?.userType === "internal");

  const [activeType, setActiveType] = useState<TicketCommentType>("comment");
  const [content, setContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: response, isLoading: isCommentsLoading } = useGetTicketCommentsQuery(
    ticketId,
    { skip: !ticketId }
  );

  const [createComment, { isLoading: isPosting }] = useCreateTicketCommentMutation();

  const rawComments = response?.data || [];
  const comments = isClientUser
    ? rawComments.filter((c) => c.type !== "internal_note")
    : rawComments;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = content.trim();
    if (!trimmed) {
      setErrorMsg("Please enter a message before posting.");
      return;
    }

    try {
      await createComment({
        ticketId,
        type: activeType,
        content: trimmed,
      }).unwrap();

      setContent("");
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to post comment";
      setErrorMsg(msg);
    }
  };

  const getAuthorName = (author: TicketCommentAuthor | string) => {
    if (!author) return "Unknown User";
    if (typeof author === "string") return "User";
    return author.name || author.email || "User";
  };

  const getAuthorEmail = (author: TicketCommentAuthor | string) => {
    if (!author || typeof author === "string") return "";
    return author.email || "";
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          Comments & Activity Notes ({comments.length})
        </h2>
      </div>

      {/* Composer Section */}
      <form onSubmit={handlePostComment} className="space-y-3">
        {/* Type Selector Tabs */}
        {canPostInternalNotes && (
          <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl w-fit text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveType("comment")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeType === "comment"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Public Comment</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType("internal_note")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeType === "internal_note"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Internal Note (Staff Only)</span>
            </button>
          </div>
        )}

        {/* Note Warning Banner */}
        {activeType === "internal_note" && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Internal notes are only visible to support team members and administrators.
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="relative">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              activeType === "internal_note"
                ? "Write an internal note for team members..."
                : "Type your comment or update here..."
            }
            className={`w-full p-3.5 border rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 transition resize-none ${
              activeType === "internal_note"
                ? "bg-amber-50/30 border-amber-200 focus:border-amber-400 focus:ring-amber-500/20"
                : "bg-slate-50/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
            }`}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Press Post to submit comment
          </p>

          <button
            type="submit"
            disabled={isPosting || !content.trim()}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 ${
              activeType === "internal_note"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isPosting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{activeType === "internal_note" ? "Add Internal Note" : "Post Comment"}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        {isCommentsLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading conversation...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No comments yet. Start the conversation by posting a response.
          </div>
        ) : (
          comments.map((item) => {
            const isNote = item.type === "internal_note";
            const authorName = getAuthorName(item.authorId);
            const authorEmail = getAuthorEmail(item.authorId);

            return (
              <div
                key={item._id}
                className={`p-4 rounded-xl border transition ${
                  isNote
                    ? "bg-amber-50/50 border-amber-200/80 shadow-2xs"
                    : "bg-slate-50/70 border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isNote
                          ? "bg-amber-200 text-amber-900"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {authorName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {authorName}
                        </span>
                        {isNote && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                            <Lock className="w-3 h-3 text-amber-700" />
                            Internal Note
                          </span>
                        )}
                      </div>
                      {authorEmail && (
                        <p className="text-[10px] text-slate-400 truncate">{authorEmail}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-9">
                  {item.content}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TicketComments;
