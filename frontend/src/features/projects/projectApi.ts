import { baseApi } from '../../app/api/baseApi';
import type {
  Project,
  ProjectMembership,
  CreateProjectPayload,
  UpdateProjectPayload,
  AddMemberPayload,
  ProjectRole,
} from './types';

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProjects: builder.query<ProjectMembership[], void>({
      query: () => '/projects/me',

      transformResponse: (response: {
        success: boolean;
        data: {
          memberships: ProjectMembership[];
        };
      }) => response.data.memberships,

      providesTags: ['Project'],
    }),

    getProject: builder.query<Project, string>({
      query: (projectId) => `/projects/${projectId}`,

      transformResponse: (response: {
        success: boolean;
        data: {
          project: Project;
        };
      }) => response.data.project,

      providesTags: (_result, _error, projectId) => [
        { type: 'Project', id: projectId },
      ],
    }),

    createProject: builder.mutation<Project, CreateProjectPayload>({
      query: (body) => ({
        url: '/projects',
        method: 'POST',
        body,
      }),

      transformResponse: (response: {
        success: boolean;
        data: {
          project: Project;
        };
      }) => response.data.project,

      invalidatesTags: ['Project'],
    }),

    getProjectMembers: builder.query<ProjectMembership[], string>({
      query: (projectId) => `/projects/${projectId}/members`,

      transformResponse: (response: {
        success: boolean;
        data: {
          members: ProjectMembership[];
        };
      }) => response.data.members,

      providesTags: (_result, _error, projectId) => [
        { type: 'ProjectMember', id: projectId },
      ],
    }),

    addProjectMember: builder.mutation<
      ProjectMembership,
      {
        projectId: string;
        body: AddMemberPayload;
      }
    >({
      query: ({ projectId, body }) => ({
        url: `/projects/${projectId}/members`,
        method: 'POST',
        body,
      }),

      transformResponse: (response: {
        success: boolean;
        data: ProjectMembership;
      }) => response.data,

      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'ProjectMember', id: projectId },
        'Project',
      ],
    }),

    updateProjectMember: builder.mutation<
      ProjectMembership,
      {
        membershipId: string;
        role: ProjectRole;
        clientOrganisation?: string;
      }
    >({
      query: ({ membershipId, role, clientOrganisation }) => ({
        url: `/projects/members/${membershipId}`,
        method: 'PATCH',
        body: {
          role,
          clientOrganisation,
        },
      }),

      transformResponse: (response: {
        success: boolean;
        data: {
          membership: ProjectMembership;
        };
      }) => response.data.membership,

      invalidatesTags: ['ProjectMember', 'Project'],
    }),

    removeProjectMember: builder.mutation<void, string>({
      query: (membershipId) => ({
        url: `/projects/members/${membershipId}`,
        method: 'DELETE',
      }),

      invalidatesTags: ['ProjectMember', 'Project'],
    }),

    getUsers: builder.query<{ _id: string; name: string; email: string; userType: 'internal' | 'client' }[], void>({
      query: () => '/auth/users',
      transformResponse: (response: {
        success: boolean;
        data: {
          users: { _id: string; name: string; email: string; userType: 'internal' | 'client' }[];
        };
      }) => response.data.users,
      providesTags: ['User'],
    }),

    updateProject: builder.mutation<
      Project,
      { projectId: string; body: UpdateProjectPayload }
    >({
      query: ({ projectId, body }) => ({
        url: `/projects/${projectId}`,
        method: 'PATCH',
        body,
      }),

      transformResponse: (response: {
        success: boolean;
        data: {
          project: Project;
        };
      }) => response.data.project,

      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Project', id: projectId },
        'Project',
      ],
    }),
  }),
});

export const {
  useGetMyProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useGetProjectMembersQuery,
  useAddProjectMemberMutation,
  useUpdateProjectMemberMutation,
  useRemoveProjectMemberMutation,
  useGetUsersQuery,
  useUpdateProjectMutation,
} = projectApi;