import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { z } from "zod";
import { api } from "@shared/routes";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireRole, getUserAllowedEventNames } from "./utils";

export function registerContactRoutes(app: Express, upload: multer.Multer) {
  app.get(api.contacts.list.path, isAuthenticated, async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) return res.json([]);
    let contactsList = await storage.getContacts(workspaceId);
    const allowed = await getUserAllowedEventNames(req.user.id, workspaceId);
    if (allowed !== null) {
      if (allowed.length === 0) return res.json([]);
      const allowedSet = new Set(allowed);
      const allAssignments = await storage.getAllAssignments(workspaceId);
      const assignedUserIds = new Set(
        allAssignments
          .filter((a: any) => allowedSet.has(a.eventName))
          .map((a: any) => a.userId)
      );
      contactsList = contactsList.filter((c: any) =>
        c.userId && assignedUserIds.has(c.userId)
      );
    }
    res.json(contactsList);
  });

  app.post(api.contacts.create.path, isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const input = api.contacts.create.input.parse(req.body);
      const contact = await storage.createContact({ ...input, workspaceId });
      res.status(201).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/contacts/import", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const { contacts: contactsData } = req.body;
      if (!Array.isArray(contactsData) || contactsData.length === 0) {
        return res.status(400).json({ message: "No contacts provided" });
      }
      const created = [];
      const errors: string[] = [];
      for (let i = 0; i < contactsData.length; i++) {
        try {
          const input = api.contacts.create.input.parse(contactsData[i]);
          const contact = await storage.createContact({ ...input, workspaceId });
          created.push(contact);
        } catch (err) {
          if (err instanceof z.ZodError) {
            errors.push(`Row ${i + 1}: ${err.errors[0].message}`);
          } else {
            errors.push(`Row ${i + 1}: Unknown error`);
          }
        }
      }
      res.status(201).json({ imported: created.length, errors });
    } catch (err) {
      res.status(500).json({ message: "Failed to import contacts" });
    }
  });

  app.patch(api.contacts.update.path, isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    try {
      const workspaceId = req.user.workspaceId;
      const id = Number(req.params.id);
      const allContacts = await storage.getContacts(workspaceId);
      const record = allContacts.find((c: any) => c.id === id);
      if (!record) return res.status(404).json({ message: "Contact not found" });
      const input = api.contacts.update.input.parse(req.body);
      const contact = await storage.updateContact(id, input);
      res.json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.contacts.delete.path, isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const id = Number(req.params.id);
    const allContacts = await storage.getContacts(workspaceId);
    const record = allContacts.find((c: any) => c.id === id);
    if (!record) return res.status(404).json({ message: "Contact not found" });
    if (record.userId) {
      return res.status(400).json({ message: "This contact is linked to a user account and cannot be deleted. Remove the user from the organization instead." });
    }
    await storage.deleteContact(id);
    res.status(204).send();
  });

  app.post("/api/contacts/bulk-delete", isAuthenticated, requireRole("owner", "manager", "admin"), async (req: any, res) => {
    const workspaceId = req.user.workspaceId;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids must be a non-empty array" });
    }
    const allContacts = await storage.getContacts(workspaceId);
    const wsIds = new Set(allContacts.map((c: any) => c.id));
    const numericIds = ids.map(Number);
    if (!numericIds.every((id: number) => wsIds.has(id))) {
      return res.status(404).json({ message: "One or more contacts not found" });
    }
    const linkedContacts = allContacts.filter((c: any) => numericIds.includes(c.id) && c.userId);
    if (linkedContacts.length > 0) {
      const names = linkedContacts.map((c: any) => [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown").join(", ");
      return res.status(400).json({ message: `Cannot delete contacts linked to user accounts: ${names}. Remove them from the organization instead.` });
    }
    const deleted = await storage.bulkDeleteContacts(numericIds);
    res.json({ deleted });
  });
}
