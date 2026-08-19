import { baseApi } from '../../app/api/baseApi';
import {
  AppNotification,
  NotificationsListResponse,
  UnreadCountResponse,
} from './types';
import { ApiResponse } from '../../types/api';

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyNotifications: builder.query<NotificationsListResponse, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/notifications/my',
        params: {
          page: params?.page || 1,
          limit: params?.limit || 20,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Notification' as const, id: _id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => '/notifications/unread-count',
      providesTags: [{ type: 'Notification', id: 'UNREAD_COUNT' }],
    }),

    markAsRead: builder.mutation<ApiResponse<AppNotification>, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'UNREAD_COUNT' },
      ],
    }),

    markAllAsRead: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'UNREAD_COUNT' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApi;
