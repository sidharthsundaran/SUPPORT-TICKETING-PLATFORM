import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters long')
    .max(100, 'Project name cannot exceed 100 characters'),

  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters long')
    .max(100, 'Project name cannot exceed 100 characters')
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),

  isActive: z.boolean().optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const addMemberSchema = z
  .object({
    userId: z.string().min(1, 'Please select a user'),
    role: z.enum([
      'project_admin',
      'support_agent',
      'engineer',
      'project_manager',
      'client_requester',
      'client_org_admin',
    ]),
    clientOrganisation: z.string().trim().optional(),
    receivesNewTicketAlerts: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const isClientRole =
        data.role === 'client_requester' || data.role === 'client_org_admin';
      if (isClientRole && (!data.clientOrganisation || !data.clientOrganisation.trim())) {
        return false;
      }
      return true;
    },
    {
      message: 'Client organization is required for client roles',
      path: ['clientOrganisation'],
    }
  );

export type AddMemberInput = z.infer<typeof addMemberSchema>;
