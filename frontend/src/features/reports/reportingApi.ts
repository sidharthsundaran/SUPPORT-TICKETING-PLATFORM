import { baseApi } from '../../app/api/baseApi';
import { DashboardMetricsResponse, ReportQueryParams } from './types';

export const reportingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query<DashboardMetricsResponse, ReportQueryParams | void>({
      query: (params) => ({
        url: '/reports/dashboard',
        params: {
          projectId: params?.projectId || undefined,
          startDate: params?.startDate || undefined,
          endDate: params?.endDate || undefined,
        },
      }),
      providesTags: [{ type: 'Ticket', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardMetricsQuery } = reportingApi;
