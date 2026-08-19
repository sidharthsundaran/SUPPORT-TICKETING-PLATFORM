import { baseApi } from '../../app/api/baseApi';
import { UserType } from '../../types/user';

export interface AdminUserItem {
  _id: string;
  name: string;
  email: string;
  userType: UserType;
  isPlatformAdmin: boolean;
  isActive: boolean;
  clientMembershipsCount: number;
  totalMembershipsCount: number;
  createdAt: string;
}

export interface GetAdminUsersResponse {
  success: boolean;
  data: {
    users: AdminUserItem[];
  };
}

export interface UpdateUserStatusResponse {
  success: boolean;
  message: string;
}

export interface UpdateUserTypeResponse {
  success: boolean;
  message: string;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query<AdminUserItem[], void>({
      query: () => '/admin/users',
      transformResponse: (response: GetAdminUsersResponse) => response.data.users,
      providesTags: ['AdminUsers'],
    }),

    updateUserStatus: builder.mutation<
      UpdateUserStatusResponse,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['AdminUsers'],
    }),

    updateUserType: builder.mutation<
      UpdateUserTypeResponse,
      { id: string; userType: UserType }
    >({
      query: ({ id, userType }) => ({
        url: `/admin/users/${id}/user-type`,
        method: 'PATCH',
        body: { userType },
      }),
      invalidatesTags: ['AdminUsers'],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useUpdateUserStatusMutation,
  useUpdateUserTypeMutation,
} = adminApi;
