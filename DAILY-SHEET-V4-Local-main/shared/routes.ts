import { z } from 'zod';
import { insertScheduleSchema, insertContactSchema, insertFileSchema, insertVenueSchema, schedules, contacts, files, venues } from './schema';

export const api = {
  schedules: {
    list: {
      method: 'GET' as const,
      path: '/api/schedules' as const,
      responses: {
        200: z.array(z.custom<typeof schedules.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/schedules' as const,
      input: insertScheduleSchema,
      responses: {
        201: z.custom<typeof schedules.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/schedules/:id' as const,
      input: insertScheduleSchema.partial(),
      responses: {
        200: z.custom<typeof schedules.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/schedules/:id' as const,
      responses: {
        204: z.void(),
      },
    },
  },
  contacts: {
    list: {
      method: 'GET' as const,
      path: '/api/contacts' as const,
      responses: {
        200: z.array(z.custom<typeof contacts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/contacts' as const,
      input: insertContactSchema,
      responses: {
        201: z.custom<typeof contacts.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/contacts/:id' as const,
      input: insertContactSchema.partial(),
      responses: {
        200: z.custom<typeof contacts.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/contacts/:id' as const,
      responses: {
        204: z.void(),
      },
    },
  },
  files: {
    list: {
      method: 'GET' as const,
      path: '/api/files' as const,
      responses: {
        200: z.array(z.custom<typeof files.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/files' as const,
      input: z.any(),
      responses: {
        201: z.custom<typeof files.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/files/:id' as const,
      responses: {
        204: z.void(),
      },
    },
  },
  venues: {
    list: {
      method: 'GET' as const,
      path: '/api/venues' as const,
      responses: {
        200: z.array(z.custom<typeof venues.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/venues' as const,
      input: insertVenueSchema,
      responses: {
        201: z.custom<typeof venues.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/venues/:id' as const,
      input: insertVenueSchema.partial(),
      responses: {
        200: z.custom<typeof venues.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/venues/:id' as const,
      responses: {
        204: z.void(),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
