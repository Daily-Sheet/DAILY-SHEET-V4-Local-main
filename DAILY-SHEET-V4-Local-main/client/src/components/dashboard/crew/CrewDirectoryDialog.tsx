import { useState, useMemo } from "react";
import { Users, Search, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { getContactShowNames } from "@/components/dashboard/crew/AssignedCrewView";
import type { Contact } from "@shared/schema";

export function CrewDirectoryDialog({ contacts, canEdit, allEventAssignments }: { contacts: Contact[]; canEdit: boolean; allEventAssignments: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const roles = useMemo(() => {
    const allDepts = contacts.flatMap((c) => c.role.split(",").map(r => r.trim()).filter(Boolean));
    return Array.from(new Set(allDepts)).sort();
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const contactDepts = contact.role.split(",").map(r => r.trim()).filter(Boolean);
      const matchesRole = roleFilter === "all" || contactDepts.includes(roleFilter);
      if (!matchesRole) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        [contact.firstName, contact.lastName].filter(Boolean).join(" ").toLowerCase().includes(q) ||
        contact.role.toLowerCase().includes(q) ||
        (contact.email && contact.email.toLowerCase().includes(q)) ||
        (contact.phone && contact.phone.toLowerCase().includes(q)) ||
        (contact.notes && contact.notes.toLowerCase().includes(q)) ||
        (getContactShowNames(contact, allEventAssignments).some((en: string) => en.toLowerCase().includes(q)))
      );
    });
  }, [contacts, searchQuery, roleFilter, allEventAssignments]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="inline-flex">
          <Button variant="outline" size="icon" className="sm:hidden" data-testid="button-crew-directory-mobile">
            <Users className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" data-testid="button-crew-directory">
            <Users className="mr-2 h-4 w-4" /> Contacts
          </Button>
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide">Contacts Directory</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Full contact directory for all crew and external contacts
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-crew-directory"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant={roleFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("all")}
            >
              All
            </Button>
            {roles.map((role) => (
              <Button
                key={role}
                variant={roleFilter === role ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter(role)}
              >
                {role}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {contacts.length === 0 ? "No contacts yet." : "No contacts match your filters."}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div key={contact.id} className="p-3 rounded-md border border-border hover-elevate" data-testid={`crew-dir-contact-${contact.id}`}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm">{[contact.firstName, contact.lastName].filter(Boolean).join(" ")}</span>
                      {contact.contactType === "external" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400">External</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap mt-0.5">
                      {contact.role.split(",").map(r => r.trim()).filter(Boolean).map(dept => (
                        <Badge key={dept} variant="secondary" className="text-xs">{dept}</Badge>
                      ))}
                    </div>
                  </div>
                  {(() => {
                    const showNames = getContactShowNames(contact, allEventAssignments);
                    return showNames.length > 0 ? (
                      <span className="flex gap-1 flex-wrap shrink-0">{showNames.map((en: string) => (
                        <Badge key={en} variant="outline" className="text-xs">{en}</Badge>
                      ))}</span>
                    ) : null;
                  })()}
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Phone className="h-3 w-3" /> {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3" /> {contact.email}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          Showing {filteredContacts.length} of {contacts.length} contacts
        </div>
      </DialogContent>
    </Dialog>
  );
}
