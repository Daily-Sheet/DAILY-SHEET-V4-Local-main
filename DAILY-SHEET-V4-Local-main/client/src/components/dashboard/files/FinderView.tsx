import { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  ChevronRight, ChevronLeft, File, FileText, FolderOpen, FolderClosed,
  Download, Upload, Plus, Search, X, Loader2, Eye, Trash2,
  Edit3, FolderInput, BarChart3, Mic2, List, Columns3, Info,
  LayoutList, GripVertical, Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl } from "@/lib/api";
import type { FileFolder } from "@shared/schema";
import { BandPortalManager } from "./BandPortalManager";

const PdfPreview = lazy(() => import("@/components/PdfPreview"));

// ---------- Types ----------

interface FinderFile {
  id: number;
  name: string;
  url: string;
  type: string;
  size: number;
  eventName: string | null;
  folderName: string | null;
  folderId: number | null;
  uploadedAt: string;
  workspaceId: number | null;
  projectId: number | null;
}

interface ColumnState {
  type: "scope" | "folder";
  scopeName?: string; // event name or "project:<id>"
  folderId?: number | null; // null = root level, number = inside a folder
  folderName?: string;
}

// ---------- Utilities ----------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type?.startsWith("image/")) return { icon: "image" as const, color: "text-violet-500" };
  if (type === "application/pdf") return { icon: "pdf" as const, color: "text-red-500" };
  if (type?.startsWith("video/")) return { icon: "video" as const, color: "text-blue-500" };
  if (type?.startsWith("audio/")) return { icon: "audio" as const, color: "text-amber-500" };
  if (type?.includes("spreadsheet") || type?.includes("csv") || type?.includes("excel"))
    return { icon: "sheet" as const, color: "text-green-500" };
  return { icon: "file" as const, color: "text-muted-foreground" };
}

function FileTypeIcon({ type, className }: { type: string; className?: string }) {
  const { icon, color } = getFileIcon(type);
  const cls = cn("flex-shrink-0", color, className);
  switch (icon) {
    case "image": return <Eye className={cls} />;
    case "pdf": return <FileText className={cls} />;
    case "video": return <BarChart3 className={cls} />;
    case "audio": return <Mic2 className={cls} />;
    case "sheet": return <List className={cls} />;
    default: return <File className={cls} />;
  }
}

function downloadFile(fileId: number) {
  const a = document.createElement("a");
  a.href = buildApiUrl(`/api/files/${fileId}/download`);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return format(d, "MMM d");
}

// ---------- FinderView ----------

export function FinderView({
  selectedEvents,
  projects = [],
}: {
  selectedEvents: string[];
  projects?: Array<{ id: number; name: string }>;
}) {
  const { data: files = [], isLoading: filesLoading } = useQuery<FinderFile[]>({
    queryKey: ["/api/files"],
  });
  const { data: folders = [] } = useQuery<FileFolder[]>({
    queryKey: ["/api/file-folders"],
  });
  const { user } = useAuth();
  const canEdit = ["owner", "manager", "admin"].includes(user?.role || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Navigation state
  const [columns, setColumns] = useState<ColumnState[]>([{ type: "scope" }]);
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: "file" | "folder"; id: number } | null>(null);
  const [previewFile, setPreviewFile] = useState<FinderFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<"column" | "list">("column");
  const [fileSearch, setFileSearch] = useState("");

  // Edit state
  const [renamingId, setRenamingId] = useState<{ type: "file" | "folder"; id: number } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newFolderTarget, setNewFolderTarget] = useState<{ scopeName: string; parentId: number | null; eventName: string | null; projectId: number | null } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "file" | "folder"; id: number; name: string } | null>(null);

  // Upload state
  const [uploadingTo, setUploadingTo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadContext, setUploadContext] = useState<{ eventName: string | null; folderId: number | null; folderName: string | null; projectId: number | null } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Multi-select state (keys are "file:123" or "folder:456")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveToOpen, setMoveToOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const toggleSelect = useCallback((type: "file" | "folder", id: number, e?: React.MouseEvent) => {
    const key = `${type}:${id}`;
    if (e?.ctrlKey || e?.metaKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    } else {
      setSelectedIds(new Set([key]));
    }
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedFileIds = useMemo(() => {
    return Array.from(selectedIds)
      .filter(k => k.startsWith("file:"))
      .map(k => parseInt(k.split(":")[1]));
  }, [selectedIds]);

  const selectedFolderIds = useMemo(() => {
    return Array.from(selectedIds)
      .filter(k => k.startsWith("folder:"))
      .map(k => parseInt(k.split(":")[1]));
  }, [selectedIds]);

  // Drag-and-drop
  const [dragItem, setDragItem] = useState<{ type: "file" | "folder"; id: number; name: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as { type: "file" | "folder"; id: number; name: string } | undefined;
    if (data) {
      setDragItem(data);
      // If dragged item isn't in selection, select only it
      const key = `${data.type}:${data.id}`;
      if (!selectedIds.has(key)) {
        setSelectedIds(new Set([key]));
      }
    }
  }, [selectedIds]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDragItem(null);
    const { over } = event;
    if (!over) return;

    const dropData = over.data.current as { type: "folder"; id: number | null } | undefined;
    if (!dropData) return;

    const targetFolderId = dropData.id;

    // Collect items to move
    const fileIdsToMove = selectedFileIds;
    const folderIdsToMove = selectedFolderIds.filter(id => id !== targetFolderId);

    if (fileIdsToMove.length > 0) {
      moveFilesMut.mutate({ fileIds: fileIdsToMove, folderId: targetFolderId });
    }
    for (const fId of folderIdsToMove) {
      moveFolderMut.mutate({ id: fId, parentId: targetFolderId });
    }
    clearSelection();
  }, [selectedFileIds, selectedFolderIds]);

  // Scoped data
  const projectIds = useMemo(() => new Set(projects.map(p => p.id)), [projects]);

  const scopeItems = useMemo(() => {
    const items: Array<{ name: string; label: string; type: "event" | "project" }> = [];
    for (const eventName of selectedEvents) {
      items.push({ name: eventName, label: eventName, type: "event" });
    }
    for (const p of projects) {
      items.push({ name: `project:${p.id}`, label: `${p.name} (Project Files)`, type: "project" });
    }
    return items;
  }, [selectedEvents, projects]);

  // Get files/folders for a given scope and parent folder
  const getItemsForColumn = useCallback(
    (scopeName: string, parentFolderId: number | null) => {
      const isProject = scopeName.startsWith("project:");
      const projectId = isProject ? parseInt(scopeName.split(":")[1]) : null;
      const eventName = isProject ? null : scopeName;

      const scopeFolders = folders.filter(f => {
        if (isProject) {
          return f.projectId === projectId && !f.eventName && f.parentId === parentFolderId;
        }
        return f.eventName === eventName && !f.projectId && f.parentId === parentFolderId;
      });

      const scopeFiles = files.filter(f => {
        const matchesFolder = parentFolderId === null
          ? (!f.folderId && !f.folderName)
          : f.folderId === parentFolderId;
        if (isProject) {
          return f.projectId === projectId && !f.eventName && matchesFolder;
        }
        return f.eventName === eventName && matchesFolder;
      });

      return { folders: scopeFolders, files: scopeFiles };
    },
    [files, folders]
  );

  // Navigate into scope
  const selectScope = useCallback((scopeName: string) => {
    setSelectedScope(scopeName);
    setSelectedItem(null);
    setColumns([{ type: "scope" }, { type: "folder", scopeName, folderId: null, folderName: "Root" }]);
  }, []);

  // Navigate into folder
  const openFolder = useCallback((scopeName: string, folderId: number, folderName: string, columnIndex: number) => {
    setSelectedItem({ type: "folder", id: folderId });
    setColumns(prev => [
      ...prev.slice(0, columnIndex + 1),
      { type: "folder", scopeName, folderId, folderName },
    ]);
    // Scroll right after state update
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({ left: scrollContainerRef.current.scrollWidth, behavior: "smooth" });
    }, 50);
  }, []);

  // Select file (show in preview)
  const selectFile = useCallback((file: FinderFile) => {
    setSelectedItem({ type: "file", id: file.id });
    setPreviewFile(file);
  }, []);

  // Breadcrumb navigation
  const navigateToBreadcrumb = useCallback((index: number) => {
    setColumns(prev => prev.slice(0, index + 1));
    setSelectedItem(null);
    if (index === 0) {
      setSelectedScope(null);
    }
  }, []);

  // ---------- Mutations ----------

  const renameFileMut = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PATCH", `/api/files/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setRenamingId(null);
    },
  });

  const renameFolderMut = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PATCH", `/api/file-folders/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setRenamingId(null);
    },
  });

  const deleteFileMut = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Deleted", description: "File removed." });
      setDeleteTarget(null);
      if (previewFile && deleteTarget?.id === previewFile.id) setPreviewFile(null);
    },
  });

  const deleteFolderMut = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/file-folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Deleted", description: "Folder and contents removed." });
      setDeleteTarget(null);
    },
  });

  const createFolderMut = useMutation({
    mutationFn: async (data: { name: string; eventName?: string; parentId?: number; projectId?: number }) => {
      const res = await apiRequest("POST", "/api/file-folders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-folders"] });
      toast({ title: "Created", description: "Folder created." });
      setNewFolderTarget(null);
      setNewFolderName("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Bulk mutations
  const moveFilesMut = useMutation({
    mutationFn: async ({ fileIds, folderId }: { fileIds: number[]; folderId: number | null }) => {
      await apiRequest("PATCH", "/api/files/bulk-move", { fileIds, folderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Moved", description: "Files moved." });
      clearSelection();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const bulkDeleteMut = useMutation({
    mutationFn: async (fileIds: number[]) => {
      await apiRequest("DELETE", "/api/files/bulk", { fileIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Deleted", description: `${selectedFileIds.length} file(s) deleted.` });
      clearSelection();
      setBulkDeleteOpen(false);
    },
  });

  const moveFolderMut = useMutation({
    mutationFn: async ({ id, parentId }: { id: number; parentId: number | null }) => {
      await apiRequest("PATCH", `/api/file-folders/${id}/move`, { parentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-folders"] });
      toast({ title: "Moved", description: "Folder moved." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !uploadContext) return;
    const fileList = e.target.files;
    setUploadingTo("uploading");

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      if (uploadContext.eventName) formData.append("eventName", uploadContext.eventName);
      if (uploadContext.folderName) formData.append("folderName", uploadContext.folderName);
      if (uploadContext.folderId) formData.append("folderId", String(uploadContext.folderId));
      if (uploadContext.projectId) formData.append("projectId", String(uploadContext.projectId));

      try {
        await fetch(buildApiUrl("/api/files"), {
          method: "POST",
          body: formData,
          credentials: "include",
        });
      } catch {
        toast({ title: "Upload Error", description: `Failed to upload ${file.name}`, variant: "destructive" });
      }
    }

    queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    toast({ title: "Uploaded", description: fileList.length > 1 ? `${fileList.length} files uploaded.` : "File uploaded." });
    setUploadingTo(null);
    setUploadContext(null);
    e.target.value = "";
  };

  const triggerUpload = (eventName: string | null, folderId: number | null, folderName: string | null, projectId: number | null) => {
    setUploadContext({ eventName, folderId, folderName, projectId });
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  // Rename handling
  const startRename = (type: "file" | "folder", id: number, currentName: string) => {
    setRenamingId({ type, id });
    setRenameValue(currentName);
  };

  const submitRename = () => {
    if (!renamingId || !renameValue.trim()) return;
    if (renamingId.type === "file") {
      renameFileMut.mutate({ id: renamingId.id, name: renameValue.trim() });
    } else {
      renameFolderMut.mutate({ id: renamingId.id, name: renameValue.trim() });
    }
  };

  // New folder handling
  const startNewFolder = (scopeName: string, parentId: number | null) => {
    const isProject = scopeName.startsWith("project:");
    const projectId = isProject ? parseInt(scopeName.split(":")[1]) : null;
    const eventName = isProject ? null : scopeName;
    setNewFolderTarget({ scopeName, parentId, eventName, projectId });
    setNewFolderName("");
  };

  const submitNewFolder = () => {
    if (!newFolderTarget || !newFolderName.trim()) return;
    const data: any = { name: newFolderName.trim() };
    if (newFolderTarget.eventName) data.eventName = newFolderTarget.eventName;
    if (newFolderTarget.parentId) data.parentId = newFolderTarget.parentId;
    if (newFolderTarget.projectId) data.projectId = newFolderTarget.projectId;
    createFolderMut.mutate(data);
  };

  // Search
  const searchResults = useMemo(() => {
    if (!fileSearch.trim()) return null;
    const q = fileSearch.toLowerCase();
    return files.filter(f =>
      (selectedEvents.includes(f.eventName || "") || (f.projectId && projectIds.has(f.projectId) && !f.eventName)) &&
      f.name?.toLowerCase().includes(q)
    );
  }, [fileSearch, files, selectedEvents, projectIds]);

  // Escape key only — close modals within the file explorer without conflicting with dashboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        if (showPreview) setShowPreview(false);
        else if (renamingId) setRenamingId(null);
        else if (newFolderTarget) setNewFolderTarget(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showPreview, renamingId, newFolderTarget]);

  // ---------- Render ----------

  if (filesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        <p className="text-sm text-muted-foreground">Loading files...</p>
      </div>
    );
  }

  if (selectedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Select a show to view its files.</p>
      </div>
    );
  }

  // Get context for the current column (for upload/new folder in context menus)
  const currentColumn = columns[columns.length - 1];
  const currentScopeName = currentColumn?.scopeName || selectedScope;
  const currentFolderId = currentColumn?.type === "folder" ? (currentColumn.folderId ?? null) : null;

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Back button */}
        {columns.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigateToBreadcrumb(columns.length - 2)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto flex-1 min-w-0">
          {columns.map((col, i) => (
            <div key={i} className="flex items-center gap-1 flex-shrink-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
              <button
                className={cn(
                  "px-1.5 py-0.5 rounded text-xs hover:bg-accent/50 transition-colors whitespace-nowrap",
                  i === columns.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"
                )}
                onClick={() => navigateToBreadcrumb(i)}
              >
                {col.type === "scope" ? "All Shows" : col.folderName || "Root"}
              </button>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-48 order-last sm:order-none">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
          {fileSearch && (
            <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-7 w-7" onClick={() => setFileSearch("")}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* View toggle — hidden on mobile (always single column) */}
        <div className="hidden sm:flex border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "column" ? "default" : "ghost"}
            size="icon"
            className="h-7 w-7 rounded-none"
            onClick={() => setViewMode("column")}
          >
            <Columns3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-7 w-7 rounded-none"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Preview toggle — hidden on mobile */}
        <Button
          variant={previewFile && showPreview ? "default" : "ghost"}
          size="icon"
          className="h-7 w-7 hidden sm:flex"
          onClick={() => {
            if (previewFile) setShowPreview(prev => !prev);
          }}
          disabled={!previewFile}
        >
          <Info className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Band Portal */}
      {canEdit && <BandPortalManager selectedEvents={selectedEvents} />}

      {/* Selection toolbar */}
      <AnimatePresence>
        {selectedIds.size > 1 && canEdit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-xs"
          >
            <span className="font-medium">{selectedIds.size} items selected</span>
            <div className="flex-1" />
            <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => setMoveToOpen(true)}>
              <FolderInput className="h-3 w-3" /> Move to...
            </Button>
            {selectedFileIds.length > 0 && (
              <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 text-destructive border-destructive/30" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={clearSelection}>
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search results */}
      {searchResults !== null ? (
        <div className="border rounded-xl bg-card/50 backdrop-blur-sm p-3">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Search className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">No files matching "{fileSearch}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map(file => (
                <FinderFileRow
                  key={file.id}
                  file={file}
                  isSelected={selectedItem?.type === "file" && selectedItem.id === file.id}
                  canEdit={canEdit}
                  isRenaming={renamingId?.type === "file" && renamingId.id === file.id}
                  renameValue={renameValue}
                  onRenameChange={setRenameValue}
                  onRenameSubmit={submitRename}
                  onRenameCancel={() => setRenamingId(null)}
                  onClick={() => selectFile(file)}
                  onDoubleClick={() => { selectFile(file); setShowPreview(true); }}
                  onStartRename={() => startRename("file", file.id, file.name)}
                  onDelete={() => setDeleteTarget({ type: "file", id: file.id, name: file.name })}
                  onDownload={() => downloadFile(file.id)}
                  onPreview={() => { selectFile(file); setShowPreview(true); }}
                />
              ))}
            </div>
          )}
        </div>
      ) : viewMode === "column" ? (
        /* Column View with DnD — stop touch events from bubbling to dashboard swipe handler */
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div
            className="border rounded-xl bg-card/50 backdrop-blur-sm overflow-hidden flex"
            style={{ minHeight: 360 }}
            onTouchStart={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
          >
            {/* Mobile: single-column drill-down (show only the active column) */}
            <div className="sm:hidden flex-1">
              {(() => {
                const col = columns[columns.length - 1];
                const colIdx = columns.length - 1;
                return col.type === "scope" ? (
                  <FinderScopeColumn
                    items={scopeItems}
                    selectedScope={selectedScope}
                    onSelectScope={selectScope}
                  />
                ) : (
                  <FinderFolderColumn
                    scopeName={col.scopeName!}
                    parentFolderId={col.folderId ?? null}
                    items={getItemsForColumn(col.scopeName!, col.folderId ?? null)}
                    selectedItem={selectedItem}
                    selectedIds={selectedIds}
                    columnIndex={colIdx}
                    canEdit={canEdit}
                    isMobile
                    isRenaming={renamingId}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onRenameSubmit={submitRename}
                    onRenameCancel={() => setRenamingId(null)}
                    onSelectFile={selectFile}
                    onOpenFolder={(folderId, folderName) => openFolder(col.scopeName!, folderId, folderName, colIdx)}
                    onStartRename={startRename}
                    onDelete={(type, id, name) => setDeleteTarget({ type, id, name })}
                    onDownload={(id) => downloadFile(id)}
                    onPreview={(file) => { selectFile(file); setShowPreview(true); }}
                    onNewFolder={() => startNewFolder(col.scopeName!, col.folderId ?? null)}
                    onUpload={() => {
                      const isProject = col.scopeName!.startsWith("project:");
                      const projectId = isProject ? parseInt(col.scopeName!.split(":")[1]) : null;
                      const eventName = isProject ? null : col.scopeName!;
                      const folder = col.folderId ? folders.find(f => f.id === col.folderId) : null;
                      triggerUpload(eventName, col.folderId ?? null, folder?.name ?? null, projectId);
                    }}
                    onToggleSelect={toggleSelect}
                    onMoveTo={() => setMoveToOpen(true)}
                    newFolderTarget={newFolderTarget}
                    newFolderName={newFolderName}
                    onNewFolderNameChange={setNewFolderName}
                    onNewFolderSubmit={submitNewFolder}
                    onNewFolderCancel={() => setNewFolderTarget(null)}
                    uploadingTo={uploadingTo}
                  />
                );
              })()}
            </div>

            {/* Desktop: multi-column side-by-side */}
            <div ref={scrollContainerRef} className="hidden sm:flex flex-1 overflow-x-auto">
              {columns.map((col, colIdx) => (
                <div key={colIdx} className={cn("flex-shrink-0 border-r border-border/30 last:border-r-0", colIdx === 0 ? "w-56" : "w-64")}>
                  {col.type === "scope" ? (
                    <FinderScopeColumn
                      items={scopeItems}
                      selectedScope={selectedScope}
                      onSelectScope={selectScope}
                    />
                  ) : (
                    <FinderFolderColumn
                      scopeName={col.scopeName!}
                      parentFolderId={col.folderId ?? null}
                      items={getItemsForColumn(col.scopeName!, col.folderId ?? null)}
                      selectedItem={selectedItem}
                      selectedIds={selectedIds}
                      columnIndex={colIdx}
                      canEdit={canEdit}
                      isRenaming={renamingId}
                      renameValue={renameValue}
                      onRenameChange={setRenameValue}
                      onRenameSubmit={submitRename}
                      onRenameCancel={() => setRenamingId(null)}
                      onSelectFile={selectFile}
                      onOpenFolder={(folderId, folderName) => openFolder(col.scopeName!, folderId, folderName, colIdx)}
                      onStartRename={startRename}
                      onDelete={(type, id, name) => setDeleteTarget({ type, id, name })}
                      onDownload={(id) => downloadFile(id)}
                      onPreview={(file) => { selectFile(file); setShowPreview(true); }}
                      onNewFolder={() => startNewFolder(col.scopeName!, col.folderId ?? null)}
                      onUpload={() => {
                        const isProject = col.scopeName!.startsWith("project:");
                        const projectId = isProject ? parseInt(col.scopeName!.split(":")[1]) : null;
                        const eventName = isProject ? null : col.scopeName!;
                        const folder = col.folderId ? folders.find(f => f.id === col.folderId) : null;
                        triggerUpload(eventName, col.folderId ?? null, folder?.name ?? null, projectId);
                      }}
                      onToggleSelect={toggleSelect}
                      onMoveTo={() => setMoveToOpen(true)}
                      newFolderTarget={newFolderTarget}
                      newFolderName={newFolderName}
                      onNewFolderNameChange={setNewFolderName}
                      onNewFolderSubmit={submitNewFolder}
                      onNewFolderCancel={() => setNewFolderTarget(null)}
                      uploadingTo={uploadingTo}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Preview panel — desktop only */}
            <AnimatePresence>
              {showPreview && previewFile && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-l border-border/30 overflow-hidden flex-shrink-0 hidden sm:block"
                >
                  <FinderPreviewPanel
                    file={previewFile}
                    onClose={() => setShowPreview(false)}
                    onDownload={() => downloadFile(previewFile.id)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {dragItem && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border shadow-lg text-xs">
                {dragItem.type === "folder" ? (
                  <FolderClosed className="h-4 w-4 text-amber-500" />
                ) : (
                  <File className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="truncate max-w-[150px]">
                  {selectedIds.size > 1 ? `${selectedIds.size} items` : dragItem.name}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="border rounded-xl bg-card/50 backdrop-blur-sm overflow-hidden">
          <FinderListView
            files={files}
            folders={folders}
            selectedEvents={selectedEvents}
            projectIds={projectIds}
            selectedItem={selectedItem}
            canEdit={canEdit}
            isRenaming={renamingId}
            renameValue={renameValue}
            onRenameChange={setRenameValue}
            onRenameSubmit={submitRename}
            onRenameCancel={() => setRenamingId(null)}
            onSelectFile={selectFile}
            onStartRename={startRename}
            onDelete={(type, id, name) => setDeleteTarget({ type, id, name })}
            onDownload={(id) => downloadFile(id)}
            onPreview={(file) => { selectFile(file); setShowPreview(true); }}
          />
        </div>
      )}

      {/* Quick Look overlay */}
      <AnimatePresence>
        {showPreview && previewFile && viewMode === "list" && (
          <QuickLookOverlay file={previewFile} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === "folder" ? "folder" : "file"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"?
              {deleteTarget?.type === "folder" ? " All files inside will also be deleted." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget?.type === "file") deleteFileMut.mutate(deleteTarget.id);
                else if (deleteTarget) deleteFolderMut.mutate(deleteTarget.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirm */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedFileIds.length} file(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the selected files? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMut.mutate(selectedFileIds)}
            >
              Delete {selectedFileIds.length} file(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move to dialog */}
      <MoveToDialog
        open={moveToOpen}
        onOpenChange={setMoveToOpen}
        folders={folders}
        selectedEvents={selectedEvents}
        projects={projects}
        onMove={(folderId) => {
          if (selectedFileIds.length > 0) {
            moveFilesMut.mutate({ fileIds: selectedFileIds, folderId });
          }
          for (const fId of selectedFolderIds) {
            if (fId !== folderId) moveFolderMut.mutate({ id: fId, parentId: folderId });
          }
          setMoveToOpen(false);
          clearSelection();
        }}
      />
    </div>
  );
}

// ---------- Scope Column ----------

function FinderScopeColumn({
  items,
  selectedScope,
  onSelectScope,
}: {
  items: Array<{ name: string; label: string; type: "event" | "project" }>;
  selectedScope: string | null;
  onSelectScope: (name: string) => void;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="p-1">
        <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Shows
        </div>
        {items.map(item => (
          <button
            key={item.name}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors group",
              selectedScope === item.name
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent/50"
            )}
            onClick={() => onSelectScope(item.name)}
          >
            {item.type === "project" ? (
              <FolderOpen className="h-4 w-4 flex-shrink-0 opacity-60" />
            ) : (
              <Mic2 className="h-4 w-4 flex-shrink-0 opacity-60" />
            )}
            <span className="truncate flex-1 text-xs">{item.label}</span>
            <ChevronRight className={cn(
              "h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity",
              selectedScope === item.name && "opacity-70"
            )} />
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ---------- Folder Column ----------

function FinderFolderColumn({
  scopeName,
  parentFolderId,
  items,
  selectedItem,
  selectedIds,
  columnIndex,
  canEdit,
  isMobile,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onSelectFile,
  onOpenFolder,
  onStartRename,
  onDelete,
  onDownload,
  onPreview,
  onNewFolder,
  onUpload,
  onToggleSelect,
  onMoveTo,
  newFolderTarget,
  newFolderName,
  onNewFolderNameChange,
  onNewFolderSubmit,
  onNewFolderCancel,
  uploadingTo,
}: {
  scopeName: string;
  parentFolderId: number | null;
  items: { folders: FileFolder[]; files: FinderFile[] };
  selectedItem: { type: "file" | "folder"; id: number } | null;
  selectedIds: Set<string>;
  columnIndex: number;
  canEdit: boolean;
  isMobile?: boolean;
  isRenaming: { type: "file" | "folder"; id: number } | null;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onSelectFile: (f: FinderFile) => void;
  onOpenFolder: (id: number, name: string) => void;
  onStartRename: (type: "file" | "folder", id: number, name: string) => void;
  onDelete: (type: "file" | "folder", id: number, name: string) => void;
  onDownload: (id: number) => void;
  onPreview: (f: FinderFile) => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onToggleSelect: (type: "file" | "folder", id: number, e?: React.MouseEvent) => void;
  onMoveTo: () => void;
  newFolderTarget: { scopeName: string; parentId: number | null; eventName: string | null; projectId: number | null } | null;
  newFolderName: string;
  onNewFolderNameChange: (v: string) => void;
  onNewFolderSubmit: () => void;
  onNewFolderCancel: () => void;
  uploadingTo: string | null;
}) {
  const isEmpty = items.folders.length === 0 && items.files.length === 0;
  const showNewFolderInput = newFolderTarget?.scopeName === scopeName && newFolderTarget?.parentId === parentFolderId;

  // Make the column background a drop target (drop to this folder level)
  const { setNodeRef: setDropRef, isOver: isOverColumn } = useDroppable({
    id: `column-drop:${scopeName}:${parentFolderId ?? "root"}`,
    data: { type: "folder" as const, id: parentFolderId },
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex flex-col h-full">
        <ScrollArea className="flex-1">
          <div
            ref={setDropRef}
            className={cn("p-1 min-h-[340px] transition-colors", isOverColumn && "bg-primary/5")}
          >
            {/* Folders */}
            {items.folders.map(folder => (
              <DraggableDroppableFolder
                key={folder.id}
                folder={folder}
                isSelected={selectedItem?.type === "folder" && selectedItem.id === folder.id}
                isMultiSelected={selectedIds.has(`folder:${folder.id}`)}
                isRenaming={isRenaming?.type === "folder" && isRenaming.id === folder.id}
                renameValue={renameValue}
                canEdit={canEdit}
                onRenameChange={onRenameChange}
                onRenameSubmit={onRenameSubmit}
                onRenameCancel={onRenameCancel}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    onToggleSelect("folder", folder.id, e);
                  } else {
                    onOpenFolder(folder.id, folder.name);
                  }
                }}
                onStartRename={() => onStartRename("folder", folder.id, folder.name)}
                onDelete={() => onDelete("folder", folder.id, folder.name)}
                onMoveTo={onMoveTo}
              />
            ))}

            {/* Files */}
            {items.files.map(file => (
              <DraggableFile
                key={file.id}
                file={file}
                isSelected={selectedItem?.type === "file" && selectedItem.id === file.id}
                isMultiSelected={selectedIds.has(`file:${file.id}`)}
                canEdit={canEdit}
                isMobile={isMobile}
                isRenaming={isRenaming?.type === "file" && isRenaming.id === file.id}
                renameValue={renameValue}
                onRenameChange={onRenameChange}
                onRenameSubmit={onRenameSubmit}
                onRenameCancel={onRenameCancel}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    onToggleSelect("file", file.id, e);
                  } else {
                    onSelectFile(file);
                  }
                }}
                onDoubleClick={() => onPreview(file)}
                onStartRename={() => onStartRename("file", file.id, file.name)}
                onDelete={() => onDelete("file", file.id, file.name)}
                onDownload={() => onDownload(file.id)}
                onPreview={() => onPreview(file)}
                onMoveTo={onMoveTo}
              />
            ))}

            {/* New folder input */}
            {showNewFolderInput && (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <FolderClosed className="h-4 w-4 flex-shrink-0 text-amber-500" />
                <input
                  autoFocus
                  className="flex-1 bg-background text-foreground text-xs border rounded px-1.5 py-0.5"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={e => onNewFolderNameChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") onNewFolderSubmit();
                    if (e.key === "Escape") onNewFolderCancel();
                  }}
                  onBlur={() => {
                    if (newFolderName.trim()) onNewFolderSubmit();
                    else onNewFolderCancel();
                  }}
                />
              </div>
            )}

            {/* Empty state */}
            {isEmpty && !showNewFolderInput && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <FolderOpen className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-[10px] text-muted-foreground">Empty</p>
              </div>
            )}

            {uploadingTo && (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </div>
            )}
          </div>
        </ScrollArea>
        {/* Action bar — always visible when user can edit */}
        {canEdit && (
          <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border/30 bg-card/80">
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 flex-1" onClick={onNewFolder}>
              <Plus className="h-3 w-3" /> New Folder
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 flex-1" onClick={onUpload}>
              <Upload className="h-3 w-3" /> Upload
            </Button>
          </div>
        )}
        </div>
      </ContextMenuTrigger>
      {canEdit && (
        <ContextMenuContent>
          <ContextMenuItem onClick={onNewFolder}>
            <Plus className="h-3.5 w-3.5 mr-2" /> New Folder
          </ContextMenuItem>
          <ContextMenuItem onClick={onUpload}>
            <Upload className="h-3.5 w-3.5 mr-2" /> Upload Files
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}

// ---------- Draggable+Droppable Folder Item ----------

function DraggableDroppableFolder({
  folder,
  isSelected,
  isMultiSelected,
  isRenaming,
  renameValue,
  canEdit,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onClick,
  onStartRename,
  onDelete,
  onMoveTo,
}: {
  folder: FileFolder;
  isSelected: boolean;
  isMultiSelected: boolean;
  isRenaming: boolean;
  renameValue: string;
  canEdit: boolean;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onClick: (e: React.MouseEvent) => void;
  onStartRename: () => void;
  onDelete: () => void;
  onMoveTo: () => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `drag-folder:${folder.id}`,
    data: { type: "folder" as const, id: folder.id, name: folder.name },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-folder:${folder.id}`,
    data: { type: "folder" as const, id: folder.id },
  });

  const ref = useCallback((node: HTMLButtonElement | null) => {
    setDragRef(node);
    setDropRef(node);
  }, [setDragRef, setDropRef]);

  const highlight = isSelected || isMultiSelected;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          ref={ref}
          {...listeners}
          {...attributes}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors group",
            highlight ? "bg-primary text-primary-foreground" : "hover:bg-accent/50",
            isOver && "ring-2 ring-primary/50 bg-primary/10",
            isDragging && "opacity-40",
          )}
          onClick={onClick}
        >
          {isSelected ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0 text-amber-500" />
          ) : (
            <FolderClosed className="h-4 w-4 flex-shrink-0 text-amber-500" />
          )}
          {isRenaming ? (
            <input
              autoFocus
              className="flex-1 bg-background text-foreground text-xs border rounded px-1 py-0.5"
              value={renameValue}
              onChange={e => onRenameChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") onRenameSubmit();
                if (e.key === "Escape") onRenameCancel();
              }}
              onBlur={onRenameSubmit}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="truncate flex-1 text-xs">{folder.name}</span>
          )}
          <ChevronRight className={cn(
            "h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity",
            highlight && "opacity-70"
          )} />
        </button>
      </ContextMenuTrigger>
      {canEdit && (
        <ContextMenuContent>
          <ContextMenuItem onClick={onClick as any}>
            <FolderOpen className="h-3.5 w-3.5 mr-2" /> Open
          </ContextMenuItem>
          <ContextMenuItem onClick={onStartRename}>
            <Edit3 className="h-3.5 w-3.5 mr-2" /> Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={onMoveTo}>
            <FolderInput className="h-3.5 w-3.5 mr-2" /> Move to...
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}

// ---------- Draggable File Item ----------

function DraggableFile({
  file,
  isSelected,
  isMultiSelected,
  canEdit,
  isMobile,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onClick,
  onDoubleClick,
  onStartRename,
  onDelete,
  onDownload,
  onPreview,
  onMoveTo,
}: {
  file: FinderFile;
  isSelected: boolean;
  isMultiSelected: boolean;
  canEdit: boolean;
  isMobile?: boolean;
  isRenaming: boolean;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onStartRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onPreview: () => void;
  onMoveTo: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `drag-file:${file.id}`,
    data: { type: "file" as const, id: file.id, name: file.name },
  });

  const highlight = isSelected || isMultiSelected;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors group",
            highlight ? "bg-primary text-primary-foreground" : "hover:bg-accent/50",
            isDragging && "opacity-40",
          )}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        >
          <FileTypeIcon type={file.type} className={cn("h-4 w-4", highlight && "text-primary-foreground")} />
          {isRenaming ? (
            <input
              autoFocus
              className="flex-1 bg-background text-foreground text-xs border rounded px-1 py-0.5"
              value={renameValue}
              onChange={e => onRenameChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") onRenameSubmit();
                if (e.key === "Escape") onRenameCancel();
              }}
              onBlur={onRenameSubmit}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="truncate flex-1 text-xs">{file.name}</span>
              {/* Download button — always visible on mobile, hover on desktop */}
              <span
                role="button"
                className={cn(
                  "flex-shrink-0 p-1 rounded-md transition-colors",
                  isMobile
                    ? "text-primary"
                    : "opacity-0 group-hover:opacity-100 hover:bg-accent/50",
                  highlight && !isMobile && "opacity-0 group-hover:opacity-100 text-primary-foreground"
                )}
                onClick={e => { e.stopPropagation(); onDownload(); }}
              >
                <Download className="h-3.5 w-3.5" />
              </span>
            </>
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onPreview}>
          <Eye className="h-3.5 w-3.5 mr-2" /> Quick Look
        </ContextMenuItem>
        <ContextMenuItem onClick={onDownload}>
          <Download className="h-3.5 w-3.5 mr-2" /> Download
        </ContextMenuItem>
        {canEdit && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onStartRename}>
              <Edit3 className="h-3.5 w-3.5 mr-2" /> Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={onMoveTo}>
              <FolderInput className="h-3.5 w-3.5 mr-2" /> Move to...
            </ContextMenuItem>
            <ContextMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ---------- File Row ----------

function FinderFileRow({
  file,
  isSelected,
  canEdit,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onClick,
  onDoubleClick,
  onStartRename,
  onDelete,
  onDownload,
  onPreview,
  compact,
}: {
  file: FinderFile;
  isSelected: boolean;
  canEdit: boolean;
  isRenaming: boolean;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onClick: () => void;
  onDoubleClick: () => void;
  onStartRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onPreview: () => void;
  compact?: boolean;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors group",
            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent/50"
          )}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        >
          <FileTypeIcon type={file.type} className={cn("h-4 w-4", isSelected && "text-primary-foreground")} />
          {isRenaming ? (
            <input
              autoFocus
              className="flex-1 bg-background text-foreground text-xs border rounded px-1 py-0.5"
              value={renameValue}
              onChange={e => onRenameChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") onRenameSubmit();
                if (e.key === "Escape") onRenameCancel();
              }}
              onBlur={onRenameSubmit}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="truncate flex-1 text-xs">{file.name}</span>
              {!compact && (
                <span className={cn("text-[10px] flex-shrink-0 hidden sm:inline", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {formatFileSize(file.size)}
                </span>
              )}
              {/* Download button — always visible on mobile, hover on desktop */}
              <span
                role="button"
                className={cn(
                  "flex-shrink-0 p-1 rounded-md transition-colors",
                  "sm:opacity-0 sm:group-hover:opacity-100 hover:bg-accent/50",
                  isSelected && "sm:text-primary-foreground"
                )}
                onClick={e => { e.stopPropagation(); onDownload(); }}
              >
                <Download className="h-3.5 w-3.5" />
              </span>
            </>
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onPreview}>
          <Eye className="h-3.5 w-3.5 mr-2" /> Quick Look
        </ContextMenuItem>
        <ContextMenuItem onClick={onDownload}>
          <Download className="h-3.5 w-3.5 mr-2" /> Download
        </ContextMenuItem>
        {canEdit && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onStartRename}>
              <Edit3 className="h-3.5 w-3.5 mr-2" /> Rename
            </ContextMenuItem>
            <ContextMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ---------- List View ----------

function FinderListView({
  files,
  folders,
  selectedEvents,
  projectIds,
  selectedItem,
  canEdit,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onSelectFile,
  onStartRename,
  onDelete,
  onDownload,
  onPreview,
}: {
  files: FinderFile[];
  folders: FileFolder[];
  selectedEvents: string[];
  projectIds: Set<number>;
  selectedItem: { type: "file" | "folder"; id: number } | null;
  canEdit: boolean;
  isRenaming: { type: "file" | "folder"; id: number } | null;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onSelectFile: (f: FinderFile) => void;
  onStartRename: (type: "file" | "folder", id: number, name: string) => void;
  onDelete: (type: "file" | "folder", id: number, name: string) => void;
  onDownload: (id: number) => void;
  onPreview: (f: FinderFile) => void;
}) {
  const scopedFiles = useMemo(() => {
    return files.filter(f =>
      selectedEvents.includes(f.eventName || "") || (f.projectId && projectIds.has(f.projectId) && !f.eventName)
    );
  }, [files, selectedEvents, projectIds]);

  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const arr = [...scopedFiles];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "size") cmp = a.size - b.size;
      else cmp = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [scopedFiles, sortBy, sortDir]);

  const toggleSort = (col: "name" | "size" | "date") => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
        <button className="flex-1 text-left" onClick={() => toggleSort("name")}>
          Name {sortBy === "name" && (sortDir === "asc" ? "↑" : "↓")}
        </button>
        <button className="w-20 text-right hidden sm:block" onClick={() => toggleSort("size")}>
          Size {sortBy === "size" && (sortDir === "asc" ? "↑" : "↓")}
        </button>
        <button className="w-24 text-right hidden sm:block" onClick={() => toggleSort("date")}>
          Modified {sortBy === "date" && (sortDir === "asc" ? "↑" : "↓")}
        </button>
        <span className="w-8 flex-shrink-0" />
      </div>
      <ScrollArea className="max-h-[500px]">
        <div className="p-1">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <FolderOpen className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">No files</p>
            </div>
          ) : (
            sorted.map(file => {
              const isSelected = selectedItem?.type === "file" && selectedItem.id === file.id;
              const isRenamingThis = isRenaming?.type === "file" && isRenaming.id === file.id;
              const folder = file.folderId ? folders.find(f => f.id === file.folderId) : null;

              return (
                <ContextMenu key={file.id}>
                  <ContextMenuTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors group",
                        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent/50"
                      )}
                      onClick={() => onSelectFile(file)}
                      onDoubleClick={() => onPreview(file)}
                    >
                      <FileTypeIcon type={file.type} className={cn("h-4 w-4", isSelected && "text-primary-foreground")} />
                      {isRenamingThis ? (
                        <input
                          autoFocus
                          className="flex-1 bg-background text-foreground text-xs border rounded px-1 py-0.5"
                          value={renameValue}
                          onChange={e => onRenameChange(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") onRenameSubmit();
                            if (e.key === "Escape") onRenameCancel();
                          }}
                          onBlur={onRenameSubmit}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span className="truncate text-xs block">{file.name}</span>
                          {(folder || file.eventName) && (
                            <span className={cn("text-[10px] block", isSelected ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
                              {file.eventName}{folder ? ` / ${folder.name}` : ""}
                            </span>
                          )}
                        </div>
                      )}
                      <span className={cn("text-[10px] w-20 text-right flex-shrink-0 hidden sm:inline", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {formatFileSize(file.size)}
                      </span>
                      <span className={cn("text-[10px] w-24 text-right flex-shrink-0 hidden sm:inline", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {timeAgo(file.uploadedAt)}
                      </span>
                      {/* Download button — always visible on mobile, hover on desktop */}
                      <span
                        role="button"
                        className={cn(
                          "flex-shrink-0 p-1 rounded-md transition-colors",
                          "sm:opacity-0 sm:group-hover:opacity-100 hover:bg-accent/50",
                          isSelected && "sm:text-primary-foreground"
                        )}
                        onClick={e => { e.stopPropagation(); onDownload(file.id); }}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onPreview(file)}>
                      <Eye className="h-3.5 w-3.5 mr-2" /> Quick Look
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onDownload(file.id)}>
                      <Download className="h-3.5 w-3.5 mr-2" /> Download
                    </ContextMenuItem>
                    {canEdit && (
                      <>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => onStartRename("file", file.id, file.name)}>
                          <Edit3 className="h-3.5 w-3.5 mr-2" /> Rename
                        </ContextMenuItem>
                        <ContextMenuItem className="text-destructive" onClick={() => onDelete("file", file.id, file.name)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------- Preview Panel (sidebar) ----------

function FinderPreviewPanel({
  file,
  onClose,
  onDownload,
}: {
  file: FinderFile;
  onClose: () => void;
  onDownload: () => void;
}) {
  const isImage = file.type?.startsWith("image/");

  return (
    <div className="flex flex-col h-full w-[280px]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-xs font-medium truncate">{file.name}</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {/* Thumbnail */}
        {isImage && (
          <div className="mb-3 rounded-lg overflow-hidden bg-black/5 aspect-video flex items-center justify-center">
            <img
              src={buildApiUrl(`/api/files/${file.id}/download`)}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        {!isImage && (
          <div className="mb-3 rounded-lg bg-accent/30 aspect-video flex items-center justify-center">
            <FileTypeIcon type={file.type} className="h-12 w-12 opacity-40" />
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-muted-foreground">Size</span>
            <p className="font-medium">{formatFileSize(file.size)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Type</span>
            <p className="font-medium">{file.type}</p>
          </div>
          {file.uploadedAt && (
            <div>
              <span className="text-muted-foreground">Uploaded</span>
              <p className="font-medium">{format(new Date(file.uploadedAt), "MMM d, yyyy h:mm a")}</p>
            </div>
          )}
          {file.eventName && (
            <div>
              <span className="text-muted-foreground">Event</span>
              <p className="font-medium">{file.eventName}</p>
            </div>
          )}
          {file.folderName && (
            <div>
              <span className="text-muted-foreground">Folder</span>
              <p className="font-medium">{file.folderName}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-border/30">
        <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={onDownload}>
          <Download className="h-3 w-3" /> Download
        </Button>
      </div>
    </div>
  );
}

// ---------- Move To Dialog ----------

function MoveToDialog({
  open,
  onOpenChange,
  folders,
  selectedEvents,
  projects,
  onMove,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  folders: FileFolder[];
  selectedEvents: string[];
  projects: Array<{ id: number; name: string }>;
  onMove: (folderId: number | null) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  // Build a tree structure from folders
  const tree = useMemo(() => {
    const roots: Array<{ folder: FileFolder; children: FileFolder[]; depth: number }> = [];
    const childMap = new Map<number | null, FileFolder[]>();

    for (const f of folders) {
      // Only show folders belonging to selected events or projects
      const isRelevant =
        (f.eventName && selectedEvents.includes(f.eventName)) ||
        (f.projectId && projects.some(p => p.id === f.projectId));
      if (!isRelevant) continue;

      const parentKey = f.parentId ?? null;
      if (!childMap.has(parentKey)) childMap.set(parentKey, []);
      childMap.get(parentKey)!.push(f);
    }

    // Flatten tree with indentation
    const flatList: Array<{ folder: FileFolder; depth: number }> = [];
    const addChildren = (parentId: number | null, depth: number) => {
      const children = childMap.get(parentId) || [];
      for (const child of children) {
        flatList.push({ folder: child, depth });
        addChildren(child.id, depth + 1);
      }
    };
    addChildren(null, 0);
    return flatList;
  }, [folders, selectedEvents, projects]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Move to folder</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-0.5 p-1">
            {/* Root option */}
            <button
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors",
                selected === null ? "bg-primary text-primary-foreground" : "hover:bg-accent/50"
              )}
              onClick={() => setSelected(null)}
            >
              <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
              <span>Root (no folder)</span>
            </button>
            {tree.map(({ folder, depth }) => (
              <button
                key={folder.id}
                className={cn(
                  "w-full flex items-center gap-2 py-1.5 rounded-md text-left text-xs transition-colors",
                  selected === folder.id ? "bg-primary text-primary-foreground" : "hover:bg-accent/50"
                )}
                style={{ paddingLeft: 8 + depth * 16 }}
                onClick={() => setSelected(folder.id)}
              >
                <FolderClosed className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                <span className="truncate">{folder.name}</span>
                {folder.eventName && (
                  <span className={cn("text-[10px] flex-shrink-0", selected === folder.id ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
                    {folder.eventName}
                  </span>
                )}
              </button>
            ))}
            {tree.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No folders available</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={() => onMove(selected)}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Quick Look Overlay ----------

function QuickLookOverlay({ file, onClose }: { file: FinderFile; onClose: () => void }) {
  const isImage = file.type?.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="relative bg-card/95 backdrop-blur-md rounded-xl border border-border/30 max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 p-3 border-b border-border/30">
          <p className="text-sm font-medium truncate flex-1">{file.name}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button asChild variant="ghost" size="icon">
              <a href={buildApiUrl(`/api/files/${file.id}/download`)} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[200px]">
          {isImage && (
            <img
              src={buildApiUrl(`/api/files/${file.id}/download`)}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain rounded-md"
            />
          )}
          {isPdf && (
            <div className="w-full h-[70vh]">
              <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
                <PdfPreview url={buildApiUrl(`/api/files/${file.id}/download`)} />
              </Suspense>
            </div>
          )}
          {!isImage && !isPdf && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <FileTypeIcon type={file.type} className="w-12 h-12" />
              <p className="text-sm">Preview not available for this file type.</p>
              <Button asChild variant="outline" size="sm">
                <a href={buildApiUrl(`/api/files/${file.id}/download`)} target="_blank" rel="noopener noreferrer">
                  <Download className="h-3 w-3 mr-1" /> Download
                </a>
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
