import { baseApi } from '../../app/api/baseApi';
import type {
  Ticket,
  PaginatedTicketsResponse,
  CreateTicketPayload,
  UpdateTicketPayload,
  TicketStatus,
  TicketQueryParams,
  TicketComment,
  CreateTicketCommentPayload,
} from './types';
import { ApiResponse } from '../../types/api';

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyTickets: builder.query<
      PaginatedTicketsResponse,
      { page?: number; limit?: number } | void
    >({
      query: (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        return `/tickets/my?page=${page}&limit=${limit}`;
      },
      providesTags: ['Ticket'],
    }),

    getProjectTickets: builder.query<
      PaginatedTicketsResponse,
      { projectId: string; page?: number; limit?: number; params?: TicketQueryParams }
    >({
      query: ({ projectId, page, limit, params }) => {
        const p = page ?? params?.page ?? 1;
        const l = limit ?? params?.limit ?? 20;
        return `/tickets/project/${projectId}?page=${p}&limit=${l}`;
      },
      providesTags: (_result, _error, { projectId }) => [
        { type: 'Ticket', id: `PROJECT_${projectId}` },
        'Ticket',
      ],
    }),

    getTicketById: builder.query<ApiResponse<Ticket>, string>({
      query: (ticketId) => `/tickets/${ticketId}`,
      providesTags: (_result, _error, ticketId) => [
        { type: 'Ticket', id: ticketId },
      ],
    }),

    createTicket: builder.mutation<ApiResponse<Ticket>, CreateTicketPayload>({
      query: (body) => ({
        url: '/tickets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Ticket'],
    }),

    updateTicketStatus: builder.mutation<
      ApiResponse<Ticket>,
      { ticketId: string; status: TicketStatus }
    >({
      query: ({ ticketId, status }) => ({
        url: `/tickets/${ticketId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: 'Ticket', id: ticketId },
        'Ticket',
      ],
    }),

    searchTickets: builder.query<PaginatedTicketsResponse, TicketQueryParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.projectId) queryParams.append('projectId', params.projectId);
        if (params.search?.trim()) queryParams.append('search', params.search.trim());
        if (params.status) queryParams.append('status', params.status);
        if (params.severity) queryParams.append('severity', params.severity);
        if (params.issueType) queryParams.append('issueType', params.issueType);
        if (params.module) queryParams.append('module', params.module);
        queryParams.append('page', String(params.page ?? 1));
        queryParams.append('limit', String(params.limit ?? 20));
        return `/tickets/search?${queryParams.toString()}`;
      },
      providesTags: ['Ticket'],
    }),

    assignTicket: builder.mutation<
      ApiResponse<Ticket>,
      { ticketId: string; assigneeId: string }
    >({
      query: ({ ticketId, assigneeId }) => ({
        url: `/tickets/${ticketId}/assign`,
        method: 'PATCH',
        body: { assigneeId },
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: 'Ticket', id: ticketId },
        'Ticket',
      ],
    }),

    updateTicket: builder.mutation<
      ApiResponse<Ticket>,
      UpdateTicketPayload
    >({
      query: ({ ticketId, ...body }) => ({
        url: `/tickets/${ticketId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: 'Ticket', id: ticketId },
        { type: 'Ticket', id: `${ticketId}_activity` },
        'Ticket',
      ],
    }),

    getPresignedUploadUrl: builder.mutation<
      ApiResponse<{ uploadUrl: string; fileUrl: string; key: string }>,
      { fileName: string; fileType: string; fileSize: number }
    >({
      query: (body) => ({
        url: '/tickets/upload-url',
        method: 'POST',
        body,
      }),
    }),

    getTicketActivities: builder.query<
      ApiResponse<{
        _id: string;
        ticketId: string;
        actorId: { _id: string; name: string; email: string; userType?: string } | string;
        action: 'created' | 'status_changed' | 'assignee_changed' | 'severity_changed' | 'details_updated' | 'comment_added' | 'internal_note_added' | 'evidence_added' | 'evidence_removed';
        oldValue?: any;
        newValue?: any;
        metadata?: any;
        createdAt: string;
      }[]>,
      string
    >({
      query: (ticketId) => `/tickets/${ticketId}/activity`,
      providesTags: (_result, _error, ticketId) => [
        { type: 'Ticket', id: `${ticketId}_activity` },
        'Ticket',
      ],
    }),

    getTicketComments: builder.query<ApiResponse<TicketComment[]>, string>({
      query: (ticketId) => `/tickets/${ticketId}/comments`,
      providesTags: (_result, _error, ticketId) => [
        { type: 'Ticket', id: `${ticketId}_comments` },
      ],
    }),

    createTicketComment: builder.mutation<
      ApiResponse<TicketComment>,
      CreateTicketCommentPayload
    >({
      query: ({ ticketId, type, content }) => ({
        url: `/tickets/${ticketId}/comments`,
        method: 'POST',
        body: { type, content },
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: 'Ticket', id: `${ticketId}_comments` },
        { type: 'Ticket', id: `${ticketId}_activity` },
        { type: 'Ticket', id: ticketId },
      ],
    }),

    getEvidenceViewUrl: builder.query<ApiResponse<{ url: string }>, string>({
      query: (key) => `/tickets/evidence-url?key=${encodeURIComponent(key)}`,
    }),

    getTeamConsoleTickets: builder.query<
      PaginatedTicketsResponse,
      TicketQueryParams & { preset?: string; clientOrganisation?: string; slaState?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.projectId) queryParams.append('projectId', params.projectId);
        if (params.search?.trim()) queryParams.append('search', params.search.trim());
        if (params.status) queryParams.append('status', params.status);
        if (params.severity) queryParams.append('severity', params.severity);
        if (params.issueType) queryParams.append('issueType', params.issueType);
        if (params.module) queryParams.append('module', params.module);
        if (params.clientOrganisation) queryParams.append('clientOrganisation', params.clientOrganisation);
        if (params.preset) queryParams.append('preset', params.preset);
        if (params.slaState) queryParams.append('slaState', params.slaState);
        queryParams.append('page', String(params.page ?? 1));
        queryParams.append('limit', String(params.limit ?? 20));
        return `/tickets/team-console?${queryParams.toString()}`;
      },
      providesTags: ['Ticket'],
    }),

    bulkUpdateTickets: builder.mutation<
      ApiResponse<{ updatedCount: number }>,
      { ticketIds: string[]; update: { assigneeId?: string | null; status?: TicketStatus; tags?: string[] } }
    >({
      query: (body) => ({
        url: '/tickets/bulk-update',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Ticket'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyTicketsQuery,
  useGetProjectTicketsQuery,
  useGetTicketByIdQuery,
  useCreateTicketMutation,
  useUpdateTicketStatusMutation,
  useAssignTicketMutation,
  useUpdateTicketMutation,
  useGetPresignedUploadUrlMutation,
  useGetEvidenceViewUrlQuery,
  useGetTicketActivitiesQuery,
  useGetTicketCommentsQuery,
  useCreateTicketCommentMutation,
  useSearchTicketsQuery,
  useGetTeamConsoleTicketsQuery,
  useBulkUpdateTicketsMutation,
} = ticketApi;
