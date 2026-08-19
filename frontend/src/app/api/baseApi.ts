import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { setCredentials, logout } from '../../features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

let isRefreshing = false;
let failedQueue: Array<() => void> = [];

const processQueue = () => {
  failedQueue.forEach((callback) => callback());
  failedQueue = [];
};

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const requestUrl = typeof args === 'string' ? args : args.url;

    if (
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register')
    ) {
      return result;
    }

    if (!isRefreshing) {
      isRefreshing = true;

      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST' },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const responsePayload = refreshResult.data as {
          data: { user: any; accessToken: string };
        };
        api.dispatch(
          setCredentials({
            user: responsePayload.data.user,
            token: responsePayload.data.accessToken,
          })
        );
        isRefreshing = false;
        processQueue();
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        isRefreshing = false;
        processQueue();
        api.dispatch(logout());
      }
    } else {
      await new Promise<void>((resolve) => {
        failedQueue.push(resolve);
      });
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User', 'Project', 'ProjectMember', 'Category', 'Ticket', 'Comment', 'Notification', 'AdminUsers'],
  endpoints: () => ({}),
});

