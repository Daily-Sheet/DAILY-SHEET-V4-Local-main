import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar, FolderOpen, MapPin, Users, Clock, Search } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateTab?: (tab: string) => void;
  onSelectShow?: (showName: string, startDate?: string, endDate?: string) => void;
}

export function CommandPalette({ open, onOpenChange, onNavigateTab, onSelectShow }: CommandPaletteProps) {
  const [, navigate] = useLocation();

  const { data: events } = useQuery<any[]>({ queryKey: ["/api/events"] });
  const { data: projects } = useQuery<any[]>({ queryKey: ["/api/projects"] });
  const { data: venues } = useQuery<any[]>({ queryKey: ["/api/venues"] });
  const { data: contacts } = useQuery<any[]>({ queryKey: ["/api/contacts"] });

  const handleSelect = useCallback((type: string, item: any) => {
    onOpenChange(false);
    switch (type) {
      case "show":
        if (onSelectShow) onSelectShow(item.name, item.startDate, item.endDate);
        if (onNavigateTab) onNavigateTab("overview");
        break;
      case "project":
        navigate(`/project/${item.id}`);
        break;
      case "venue":
        if (onNavigateTab) onNavigateTab("venue");
        break;
      case "contact":
        if (onNavigateTab) onNavigateTab("assigned-crew");
        break;
    }
  }, [onOpenChange, onNavigateTab, onSelectShow, navigate]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search shows, projects, venues, contacts..." data-testid="command-palette-input" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {events && events.length > 0 && (
          <CommandGroup heading="Shows">
            {events.map((event: any) => (
              <CommandItem
                key={`show-${event.id}`}
                value={`show ${event.name}`}
                onSelect={() => handleSelect("show", event)}
                data-testid={`command-show-${event.id}`}
              >
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{event.name}</span>
                {event.startDate && (
                  <span className="ml-auto text-xs text-muted-foreground">{event.startDate}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {projects && projects.length > 0 && (
          <CommandGroup heading="Projects">
            {projects.filter((p: any) => !p.archived).map((project: any) => (
              <CommandItem
                key={`project-${project.id}`}
                value={`project ${project.name}`}
                onSelect={() => handleSelect("project", project)}
                data-testid={`command-project-${project.id}`}
              >
                <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{project.name}</span>
                {project.projectNumber && (
                  <span className="ml-auto text-xs text-muted-foreground">{project.projectNumber}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {venues && venues.length > 0 && (
          <CommandGroup heading="Venues">
            {venues.map((venue: any) => (
              <CommandItem
                key={`venue-${venue.id}`}
                value={`venue ${venue.name} ${venue.address || ""}`}
                onSelect={() => handleSelect("venue", venue)}
                data-testid={`command-venue-${venue.id}`}
              >
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{venue.name}</span>
                {venue.address && (
                  <span className="ml-auto text-xs text-muted-foreground truncate max-w-[200px]">{venue.address}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {contacts && contacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {contacts.slice(0, 20).map((contact: any) => (
              <CommandItem
                key={`contact-${contact.id}`}
                value={`contact ${contact.firstName} ${contact.lastName || ""} ${contact.role || ""}`}
                onSelect={() => handleSelect("contact", contact)}
                data-testid={`command-contact-${contact.id}`}
              >
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{contact.firstName} {contact.lastName}</span>
                {contact.role && (
                  <span className="ml-auto text-xs text-muted-foreground">{contact.role}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
