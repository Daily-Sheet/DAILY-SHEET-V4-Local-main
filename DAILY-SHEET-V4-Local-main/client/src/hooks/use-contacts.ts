import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Contact, InsertContact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useContacts() {
  return useQuery<Contact[]>({
    queryKey: [api.contacts.list.path],
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertContact) => {
      const res = await apiRequest("POST", api.contacts.create.path, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] }),
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertContact> }) => {
      const res = await apiRequest("PATCH", buildUrl(api.contacts.update.path, { id }), data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] }),
  });
}

export function useBulkImportContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contacts: InsertContact[]) => {
      const res = await apiRequest("POST", "/api/contacts/import", { contacts });
      return res.json() as Promise<{ imported: number; errors: string[] }>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] }),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.contacts.delete.path, { id }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] }),
  });
}

export function useBulkDeleteContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiRequest("POST", "/api/contacts/bulk-delete", { ids });
      return res.json() as Promise<{ deleted: number }>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] }),
  });
}
