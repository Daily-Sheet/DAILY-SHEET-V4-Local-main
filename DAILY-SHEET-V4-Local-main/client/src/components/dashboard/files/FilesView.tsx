import { useState, useMemo, lazy, Suspense } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, FileText, File, Download, Upload, X, Plus, Check,
  FolderOpen, ChevronDown, ChevronRight, Search, Loader2,
  Mic2, List, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import type { FileFolder } from "@shared/schema";
import { BandPortalManager } from "./BandPortalManager";

const PdfPreview = lazy(() => import("@/components/PdfPreview"));

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return { icon: "image" as const, color: "text-violet-500" };
  if (type === "application/pdf") return { icon: "pdf" as const, color: "text-red-500" };
  if (type.startsWith("video/")) return { icon: "video" as const, color: "text-blue-500" };
  if (type.startsWith("audio/")) return { icon: "audio" as const, color: "text-amber-500" };
  if (type.includes("spreadsheet") || type.includes("csv") || type.includes("excel")) return { icon: "sheet" as const, color: "text-green-500" };
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

function FileRow({ file, canEdit, onDelete, onRename, onPreview, index = 0 }: {
  file: any;
  canEdit: boolean;
  onDelete: () => void;
  onRename: (name: string) => void;
  onPreview?: () => void;
  index?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(file.name);
  const isImage = file.type?.startsWith("image/");
  const uploadedAt = file.uploadedAt ? new Date(file.uploadedAt) : null;
  const timeAgo = uploadedAt ? (() => {
    const diff = Date.now() - uploadedAt.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return format(uploadedAt, "MMM d");
  })() : null;

  const handleRenameSubmit = () => {
    if (editName.trim() && editName.trim() !== file.name) {
      onRename(editName.trim());
    }
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm active:scale-[0.98] transition-transform"
      data-testid={`file-item-${file.id}`}
    >
      {isImage ? (
        <div
          className="flex-shrink-0 cursor-pointer"
          onClick={() => onPreview?.()}
          data-testid={`button-preview-thumbnail-${file.id}`}
        >
          <div className="w-10 h-10 rounded-md overflow-hidden bg-muted/50 border border-border/30">
            <img
              src={`/api/files/${file.id}/download`}
              alt={file.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      ) : (
        <div
          className="w-10 h-10 rounded-md bg-muted/50 border border-border/30 flex items-center justify-center flex-shrink-0 cursor-pointer"
          onClick={() => onPreview?.()}
          data-testid={`button-preview-icon-${file.id}`}
        >
          <FileTypeIcon type={file.type} className="w-5 h-5" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") { setEditing(false); setEditName(file.name); }
              }}
              onBlur={handleRenameSubmit}
              className="h-7 text-sm"
              autoFocus
              data-testid={`input-rename-file-${file.id}`}
            />
          </div>
        ) : (
          <p
            className={cn("text-sm font-medium truncate", canEdit && "cursor-pointer")}
            onClick={() => { if (canEdit) { setEditing(true); setEditName(file.name); } }}
            data-testid={`text-filename-${file.id}`}
          >
            {file.name}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{file.type?.split("/")[1]?.toUpperCase() || "FILE"}</span>
          <span className="opacity-40">|</span>
          <span>{formatFileSize(file.size || 0)}</span>
          {timeAgo && (
            <>
              <span className="opacity-40">|</span>
              <span>{timeAgo}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        {onPreview && (file.type?.startsWith("image/") || file.type === "application/pdf") && (
          <Button variant="ghost" size="icon" onClick={() => onPreview()} data-testid={`button-preview-file-${file.id}`}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button asChild variant="ghost" size="icon" data-testid={`button-download-file-${file.id}`}>
          <a href={`/api/files/${file.id}/download`} target="_blank" rel="noopener noreferrer">
            <Download className="h-3.5 w-3.5" />
          </a>
        </Button>
        {canEdit && (
          <ConfirmDelete
            onConfirm={onDelete}
            title="Delete file?"
            description={`Remove "${file.name}" permanently?`}
            triggerClassName="text-destructive"
            data-testid={`button-delete-file-${file.id}`}
          />
        )}
      </div>
    </motion.div>
  );
}

function UploadZone({ onUpload, uploading, uploadKey, activeKey, label, testId, progressText }: {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  uploadKey: string;
  activeKey: string | null;
  label?: string;
  testId?: string;
  progressText?: string | null;
}) {
  const inputId = `upload-${uploadKey.replace(/[^a-zA-Z0-9]/g, "-")}`;
  const isUploading = uploading && activeKey === uploadKey;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all backdrop-blur-sm",
        isUploading
          ? "border-primary/50 bg-primary/5"
          : "border-border/30 hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]"
      )}
      data-testid={testId}
    >
      {isUploading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Upload className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="text-xs text-muted-foreground font-medium">
        {isUploading ? (progressText || "Uploading...") : (label || "Upload Files")}
      </span>
      <input
        type="file"
        id={inputId}
        className="hidden"
        onChange={onUpload}
        disabled={uploading}
        multiple
      />
    </label>
  );
}

export function FilePreviewPanel({ file, onClose }: { file: any; onClose: () => void }) {
  const isImage = file.type?.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="file-preview-overlay"
    >
      <div
        className="relative bg-card/95 backdrop-blur-md rounded-xl border border-border/30 max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-testid={`file-preview-${file.id}`}
      >
        <div className="flex items-center justify-between gap-2 p-3 border-b border-border/30">
          <p className="text-sm font-medium truncate flex-1" data-testid="text-preview-filename">{file.name}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button asChild variant="ghost" size="icon" data-testid="button-preview-download">
              <a href={`/api/files/${file.id}/download`} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-preview-close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[200px]">
          {isImage && (
            <img
              src={`/api/files/${file.id}/download`}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain rounded-md"
              data-testid="img-preview"
            />
          )}
          {isPdf && (
            <div className="w-full h-[70vh]">
              <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
                <PdfPreview url={`/api/files/${file.id}/download`} />
              </Suspense>
            </div>
          )}
          {!isImage && !isPdf && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <FileTypeIcon type={file.type} className="w-12 h-12" />
              <p className="text-sm">Preview not available for this file type.</p>
              <Button asChild variant="outline" size="sm">
                <a href={`/api/files/${file.id}/download`} target="_blank" rel="noopener noreferrer">
                  <Download className="h-3 w-3 mr-1" /> Download
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FolderTreeNode({
  folder,
  allFolders,
  allFiles,
  canEdit,
  expandedFolders,
  toggleFolder,
  deleteFile,
  renameFile,
  deleteFolder,
  renameFolder,
  createFolder,
  handleFileUpload,
  uploadTarget,
  isUploading,
  uploadProgressText,
  showName,
  depth,
  renamingFolderId,
  setRenamingFolderId,
  editFolderName,
  setEditFolderName,
  newFolderParent,
  setNewFolderParent,
  newFolderName,
  setNewFolderName,
  onPreview,
}: {
  folder: FileFolder;
  allFolders: FileFolder[];
  allFiles: any[];
  canEdit: boolean;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (key: string) => void;
  deleteFile: any;
  renameFile: any;
  deleteFolder: any;
  renameFolder: any;
  createFolder: any;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, eventName: string, folderName?: string) => void;
  uploadTarget: string | null;
  isUploading: boolean;
  uploadProgressText: string | null;
  showName: string;
  depth: number;
  renamingFolderId: number | null;
  setRenamingFolderId: (id: number | null) => void;
  editFolderName: string;
  setEditFolderName: (name: string) => void;
  newFolderParent: string | null;
  setNewFolderParent: (key: string | null) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  onPreview: (file: any) => void;
}) {
  const folderKey = `${showName}__folder_${folder.id}`;
  const childFolders = allFolders.filter(f => f.parentId === folder.id);
  const folderFiles = allFiles.filter((f: any) => f.folderName === folder.name && f.eventName === showName);
  const isFolderExpanded = expandedFolders[folderKey] !== false;
  const isRenaming = renamingFolderId === folder.id;
  const newFolderKey = `subfolder_${folder.id}`;
  const isCreatingChild = newFolderParent === newFolderKey;
  const totalItems = childFolders.length + folderFiles.length;

  const handleRenameSubmit = () => {
    if (editFolderName.trim() && editFolderName.trim() !== folder.name) {
      renameFolder.mutate({ id: folder.id, name: editFolderName.trim() });
    }
    setRenamingFolderId(null);
  };

  return (
    <div
      className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm"
      style={{ marginLeft: depth > 0 ? `${depth * 12}px` : undefined }}
      data-testid={`folder-${folder.id}`}
    >
      <div
        className="flex items-center gap-2.5 p-3 cursor-pointer active:scale-[0.99] transition-transform"
        onClick={() => toggleFolder(folderKey)}
        data-testid={`button-toggle-folder-${folder.id}`}
      >
        <FolderOpen className="h-4 w-4 text-primary/70 flex-shrink-0" />
        {isRenaming ? (
          <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <Input
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") setRenamingFolderId(null);
              }}
              onBlur={handleRenameSubmit}
              className="h-7 text-sm flex-1"
              autoFocus
              data-testid={`input-rename-folder-${folder.id}`}
            />
          </div>
        ) : (
          <span
            className={cn("text-sm font-semibold flex-1 truncate", canEdit && "cursor-pointer")}
            onClick={(e) => {
              if (canEdit) {
                e.stopPropagation();
                setRenamingFolderId(folder.id);
                setEditFolderName(folder.name);
              }
            }}
            data-testid={`text-foldername-${folder.id}`}
          >
            {folder.name}
          </span>
        )}
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{totalItems}</Badge>
        {canEdit && (
          <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setNewFolderParent(newFolderKey); setNewFolderName(""); }}
              data-testid={`button-new-subfolder-${folder.id}`}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <ConfirmDelete
              onConfirm={() => deleteFolder.mutate(folder.id)}
              title="Delete folder?"
              description={`Delete folder "${folder.name}" and all its contents?`}
              triggerClassName="text-destructive"
              data-testid={`button-delete-folder-${folder.id}`}
            />
          </span>
        )}
        <motion.div animate={{ rotate: isFolderExpanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {isFolderExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5">
              {isCreatingChild && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Subfolder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newFolderName.trim()) {
                        createFolder.mutate({ name: newFolderName.trim(), eventName: showName, parentId: folder.id });
                      }
                      if (e.key === "Escape") { setNewFolderParent(null); setNewFolderName(""); }
                    }}
                    className="flex-1"
                    autoFocus
                    data-testid={`input-new-subfolder-name-${folder.id}`}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newFolderName.trim()) createFolder.mutate({ name: newFolderName.trim(), eventName: showName, parentId: folder.id });
                    }}
                    disabled={!newFolderName.trim() || createFolder.isPending}
                    data-testid={`button-create-subfolder-${folder.id}`}
                  >
                    {createFolder.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setNewFolderParent(null); setNewFolderName(""); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {childFolders.map((child) => (
                <FolderTreeNode
                  key={child.id}
                  folder={child}
                  allFolders={allFolders}
                  allFiles={allFiles}
                  canEdit={canEdit}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  deleteFile={deleteFile}
                  renameFile={renameFile}
                  deleteFolder={deleteFolder}
                  renameFolder={renameFolder}
                  createFolder={createFolder}
                  handleFileUpload={handleFileUpload}
                  uploadTarget={uploadTarget}
                  isUploading={isUploading}
                  uploadProgressText={uploadProgressText}
                  showName={showName}
                  depth={0}
                  renamingFolderId={renamingFolderId}
                  setRenamingFolderId={setRenamingFolderId}
                  editFolderName={editFolderName}
                  setEditFolderName={setEditFolderName}
                  newFolderParent={newFolderParent}
                  setNewFolderParent={setNewFolderParent}
                  newFolderName={newFolderName}
                  setNewFolderName={setNewFolderName}
                  onPreview={onPreview}
                />
              ))}
              {folderFiles.map((file: any, idx: number) => (
                <FileRow
                  key={file.id}
                  file={file}
                  canEdit={canEdit}
                  onDelete={() => deleteFile.mutate(file.id)}
                  onRename={(name) => renameFile.mutate({ id: file.id, name })}
                  onPreview={() => onPreview(file)}
                  index={idx}
                />
              ))}
              {canEdit && (
                <UploadZone
                  onUpload={(e) => handleFileUpload(e, showName, folder.name)}
                  uploading={isUploading}
                  uploadKey={`${showName}__${folder.name}`}
                  activeKey={uploadTarget}
                  label="Upload to folder"
                  testId={`button-upload-folder-${folder.id}`}
                  progressText={uploadProgressText}
                />
              )}
              {folderFiles.length === 0 && childFolders.length === 0 && !canEdit && (
                <p className="text-xs text-muted-foreground py-2 text-center">No files in this folder.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilesView({ selectedEvents }: { selectedEvents: string[] }) {
  const { data: files = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/files"],
    queryFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/files", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
  });
  const { data: foldersList = [] } = useQuery<FileFolder[]>({
    queryKey: ["/api/file-folders"],
    queryFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/file-folders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
  });
  const { user } = useAuth();
  const canEdit = ["owner", "manager", "admin"].includes(user?.role || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [expandedShows, setExpandedShows] = useState<Record<string, boolean>>({});
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [newFolderShow, setNewFolderShow] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null);
  const [multiUploadProgress, setMultiUploadProgress] = useState<string | null>(null);

  const deleteFile = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/files/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete file");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Deleted", description: "File removed successfully." });
    },
  });

  const renameFile = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to rename file");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
  });

  const renameFolder = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/file-folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to rename folder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setRenamingFolderId(null);
    },
  });

  const [isMultiUploading, setIsMultiUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, eventName: string, folderName?: string) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const totalFiles = fileList.length;
    const uploadKey = `${eventName}__${folderName || "root"}`;
    setUploadTarget(uploadKey);
    setIsMultiUploading(true);

    for (let i = 0; i < totalFiles; i++) {
      setMultiUploadProgress(totalFiles > 1 ? `Uploading ${i + 1} of ${totalFiles}...` : "Uploading...");
      const file = fileList[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append("eventName", eventName);
      if (folderName) formData.append("folderName", folderName);
      try {
        const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/files", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to upload file");
      } catch (err: any) {
        toast({ title: "Upload Error", description: `Failed to upload ${file.name}`, variant: "destructive" });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    toast({ title: "Uploaded", description: totalFiles > 1 ? `${totalFiles} files uploaded successfully.` : "File uploaded successfully." });
    setUploadTarget(null);
    setMultiUploadProgress(null);
    setIsMultiUploading(false);
    e.target.value = "";
  };

  const createFolder = useMutation({
    mutationFn: async ({ name, eventName, parentId }: { name: string; eventName: string; parentId?: number }) => {
      const body: any = { name, eventName };
      if (parentId) body.parentId = parentId;
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/file-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create folder");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-folders"] });
      toast({ title: "Created", description: "Folder created." });
      setNewFolderName("");
      setNewFolderShow(null);
      setNewFolderParent(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/file-folders/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete folder");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({ title: "Deleted", description: "Folder and its files removed." });
    },
  });

  const toggleFolder = (key: string) => {
    setExpandedFolders(prev => ({ ...prev, [key]: prev[key] === undefined ? false : !prev[key] }));
  };

  const toggleShow = (name: string) => {
    setExpandedShows(prev => ({ ...prev, [name]: prev[name] === false ? true : prev[name] === undefined ? false : !prev[name] }));
  };

  const searchFilteredFiles = useMemo(() => {
    if (!fileSearch.trim()) return null;
    const q = fileSearch.toLowerCase();
    return files.filter((f: any) =>
      selectedEvents.includes(f.eventName) &&
      f.name?.toLowerCase().includes(q)
    );
  }, [fileSearch, files, selectedEvents]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      <p className="text-sm text-muted-foreground">Loading files...</p>
    </div>
  );

  if (selectedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Select a show to view its files.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={fileSearch}
          onChange={(e) => setFileSearch(e.target.value)}
          className="pl-9"
          data-testid="input-file-search"
        />
        {fileSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => setFileSearch("")}
            data-testid="button-clear-file-search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {canEdit && <BandPortalManager selectedEvents={selectedEvents} />}

      {searchFilteredFiles !== null ? (
        <div className="space-y-1.5">
          {searchFilteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Search className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">No files matching "{fileSearch}"</p>
            </div>
          ) : (
            searchFilteredFiles.map((file: any, idx: number) => {
              const folder = file.folderName ? foldersList.find((f: FileFolder) => f.name === file.folderName && f.eventName === file.eventName) : null;
              return (
                <div key={file.id}>
                  <div className="flex items-center gap-1 mb-0.5 text-[10px] text-muted-foreground px-1">
                    <span>{file.eventName}</span>
                    {folder && (
                      <>
                        <ChevronRight className="h-2.5 w-2.5" />
                        <span>{folder.name}</span>
                      </>
                    )}
                  </div>
                  <FileRow
                    file={file}
                    canEdit={canEdit}
                    onDelete={() => deleteFile.mutate(file.id)}
                    onRename={(name) => renameFile.mutate({ id: file.id, name })}
                    onPreview={() => setPreviewFile(file)}
                    index={idx}
                  />
                </div>
              );
            })
          )}
        </div>
      ) : (
        selectedEvents.map((showName) => {
          const showFolders = foldersList.filter((f: FileFolder) => f.eventName === showName);
          const rootFolders = showFolders.filter(f => !f.parentId);
          const showFiles = files.filter((f: any) => f.eventName === showName);
          const isShowExpanded = expandedShows[showName] !== false;

          return (
            <motion.div
              key={showName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm"
              data-testid={`show-files-${showName}`}
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => toggleShow(showName)}
                data-testid={`button-toggle-show-files-${showName}`}
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm uppercase tracking-wide font-semibold truncate">{showName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {showFolders.length} folder{showFolders.length !== 1 ? "s" : ""}, {showFiles.length} file{showFiles.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <motion.div animate={{ rotate: isShowExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>

              <AnimatePresence initial={false}>
                {isShowExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {canEdit && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {newFolderShow === showName ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                placeholder="Folder name"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && newFolderName.trim()) {
                                    createFolder.mutate({ name: newFolderName.trim(), eventName: showName });
                                  }
                                  if (e.key === "Escape") { setNewFolderShow(null); setNewFolderName(""); }
                                }}
                                className="flex-1"
                                data-testid={`input-new-folder-name-${showName}`}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (newFolderName.trim()) createFolder.mutate({ name: newFolderName.trim(), eventName: showName });
                                }}
                                disabled={!newFolderName.trim() || createFolder.isPending}
                                data-testid={`button-create-folder-${showName}`}
                              >
                                {createFolder.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setNewFolderShow(null); setNewFolderName(""); }}
                                data-testid={`button-cancel-new-folder-${showName}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => setNewFolderShow(showName)}
                              data-testid={`button-new-folder-${showName}`}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              New Folder
                            </Button>
                          )}
                        </div>
                      )}

                      {rootFolders.map((folder: FileFolder) => (
                        <FolderTreeNode
                          key={folder.id}
                          folder={folder}
                          allFolders={showFolders}
                          allFiles={showFiles}
                          canEdit={canEdit}
                          expandedFolders={expandedFolders}
                          toggleFolder={toggleFolder}
                          deleteFile={deleteFile}
                          renameFile={renameFile}
                          deleteFolder={deleteFolder}
                          renameFolder={renameFolder}
                          createFolder={createFolder}
                          handleFileUpload={handleFileUpload}
                          uploadTarget={uploadTarget}
                          isUploading={isMultiUploading}
                          uploadProgressText={multiUploadProgress}
                          showName={showName}
                          depth={0}
                          renamingFolderId={renamingFolderId}
                          setRenamingFolderId={setRenamingFolderId}
                          editFolderName={editFolderName}
                          setEditFolderName={setEditFolderName}
                          newFolderParent={newFolderParent}
                          setNewFolderParent={setNewFolderParent}
                          newFolderName={newFolderName}
                          setNewFolderName={setNewFolderName}
                          onPreview={setPreviewFile}
                        />
                      ))}

                      {(() => {
                        const looseFiles = showFiles.filter((f: any) => !f.folderName);
                        if (looseFiles.length === 0 && !canEdit && showFolders.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                              <File className="h-8 w-8 text-muted-foreground/20" />
                              <p className="text-xs text-muted-foreground">No files for this show yet.</p>
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-1.5">
                            {looseFiles.map((file: any, idx: number) => (
                              <FileRow
                                key={file.id}
                                file={file}
                                canEdit={canEdit}
                                onDelete={() => deleteFile.mutate(file.id)}
                                onRename={(name) => renameFile.mutate({ id: file.id, name })}
                                onPreview={() => setPreviewFile(file)}
                                index={idx}
                              />
                            ))}
                            {canEdit && (
                              <UploadZone
                                onUpload={(e) => handleFileUpload(e, showName)}
                                uploading={isMultiUploading}
                                uploadKey={`${showName}__root`}
                                activeKey={uploadTarget}
                                testId={`button-upload-show-${showName}`}
                                progressText={multiUploadProgress}
                              />
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      )}

      <AnimatePresence>
        {previewFile && (
          <FilePreviewPanel file={previewFile} onClose={() => setPreviewFile(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
