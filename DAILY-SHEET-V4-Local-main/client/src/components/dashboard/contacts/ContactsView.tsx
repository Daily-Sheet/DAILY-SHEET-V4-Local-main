import { useState, useMemo } from "react";
import { Phone, Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserActivity, ActiveDot, matchesSearch } from "@/components/dashboard/utils";
import { CreateContactDialog } from "@/components/CreateContactDialog";
import { getContactShowNames } from "@/components/dashboard/crew/AssignedCrewView";
import type { Contact } from "@shared/schema";

export function ContactsView({ contacts, canEdit, allEventAssignments, dashboardSearchQuery = "" }: { contacts: Contact[]; canEdit: boolean; allEventAssignments: any[]; dashboardSearchQuery?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "crew" | "external">("all");
  const activityMap = useUserActivity();

  const roles = useMemo(() => {
    const allDepts = contacts.flatMap((c) => c.role.split(",").map(r => r.trim()).filter(Boolean));
    return Array.from(new Set(allDepts)).sort();
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const ct = contact.contactType || "crew";
      if (typeFilter !== "all" && ct !== typeFilter) return false;
      const contactDepts = contact.role.split(",").map(r => r.trim()).filter(Boolean);
      const matchesRole = roleFilter === "all" || contactDepts.includes(roleFilter);
      if (!matchesRole) return false;
      if (dashboardSearchQuery.trim()) {
        if (!matchesSearch(dashboardSearchQuery, contact.firstName, contact.lastName, contact.email, contact.phone, contact.role)) return false;
      }
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
  }, [contacts, searchQuery, roleFilter, typeFilter, allEventAssignments, dashboardSearchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-display uppercase tracking-wide">Contact Directory</h2>
        {canEdit && <CreateContactDialog />}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-contacts"
          />
        </div>
        <div className="flex gap-1 rounded-lg border p-1 h-fit shrink-0" data-testid="filter-contact-type">
          {([
            { value: "all" as const, label: "All" },
            { value: "crew" as const, label: "Crew" },
            { value: "external" as const, label: "External" },
          ]).map(opt => (
            <Button
              key={opt.value}
              type="button"
              variant={typeFilter === opt.value ? "default" : "ghost"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setTypeFilter(opt.value)}
              data-testid={`button-filter-type-${opt.value}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant={roleFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setRoleFilter("all")}
          data-testid="button-filter-all"
        >
          All
        </Button>
        {roles.map((role) => (
          <Button
            key={role}
            variant={roleFilter === role ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter(role)}
            data-testid={`button-filter-${role.toLowerCase()}`}
          >
            {role}
          </Button>
        ))}
      </div>

      {filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {contacts.length === 0 ? "No contacts yet." : "No contacts match your filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg transition-shadow" data-testid={`card-contact-${contact.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <ActiveDot userId={contact.userId} activityMap={activityMap} />
                      <CardTitle>{[contact.firstName, contact.lastName].filter(Boolean).join(" ")}</CardTitle>
                      {contact.contactType === "external" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400" data-testid={`badge-contact-type-${contact.id}`}>External</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {contact.role.split(",").map(r => r.trim()).filter(Boolean).map(dept => (
                        <Badge key={dept} variant="secondary" className="text-xs">{dept}</Badge>
                      ))}
                    </div>
                  </div>
                  {(() => {
                    const contactAssignments = contact.userId ? allEventAssignments.filter((a: any) => a.userId === contact.userId) : [];
                    return contactAssignments.length > 0 ? (
                      <span className="flex gap-1 flex-wrap max-w-[50%]">{contactAssignments.map((a: any) => (
                        <Badge key={a.eventName} variant="outline" data-testid={`badge-contact-event-${contact.id}-${a.eventName}`}>
                          {a.eventName}{a.position ? ` \u00B7 ${a.position}` : ""}
                        </Badge>
                      ))}</span>
                    ) : null;
                  })()}
                </div>
              </CardHeader>
              <CardContent>
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm truncate">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    {contact.email}
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                    {contact.phone}
                  </div>
                )}
                {contact.notes && (
                  <div className="text-sm text-muted-foreground mt-2 italic">"{contact.notes}"</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Showing {filteredContacts.length} of {contacts.length} contacts
      </div>
    </div>
  );
}
