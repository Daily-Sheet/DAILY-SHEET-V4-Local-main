import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Music2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalFile {
  id: number;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface PortalInfo {
  bandName: string;
  eventName: string;
  folderName: string;
  notes: string | null;
  files: PortalFile[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BandPortalPage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const { data: portal, isLoading, error } = useQuery<PortalInfo>({
    queryKey: [`/api/portal/${token}`],
    queryFn: async () => {
      const res = await fetch(`/api/portal/${token}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Link not found" }));
        throw new Error(data.message);
      }
      return res.json();
    },
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      const res = await fetch(`/api/portal/${token}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(data.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portal/${token}`] });
    },
  });

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const total = fileList.length;
    for (let i = 0; i < total; i++) {
      setUploadProgress(`Uploading ${i + 1} of ${total}...`);
      try {
        await uploadMutation.mutateAsync(fileList[i]);
      } catch {
        // error handled by mutation
      }
    }
    setUploadProgress(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Link Unavailable</h1>
          <p className="text-gray-500">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!portal) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Music2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{portal.bandName}</h1>
              <p className="text-sm text-gray-500">{portal.eventName}</p>
            </div>
          </div>
          {portal.notes && (
            <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{portal.notes}</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Upload area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-colors cursor-pointer",
            dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/50",
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploadProgress ? (
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 mx-auto text-indigo-500 animate-spin" />
              <p className="text-sm font-medium text-gray-700">{uploadProgress}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-10 w-10 mx-auto text-gray-400" />
              <div>
                <p className="text-base font-medium text-gray-700">
                  Drop your rider here or click to browse
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  PDF, images, documents up to 50MB each
                </p>
              </div>
            </div>
          )}
        </div>

        {uploadMutation.isError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{(uploadMutation.error as Error).message}</span>
          </div>
        )}

        {uploadMutation.isSuccess && !uploadProgress && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>File uploaded successfully!</span>
          </div>
        )}

        {/* Already uploaded files */}
        {portal.files.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Uploaded Files ({portal.files.length})
            </h2>
            <div className="space-y-2">
              {portal.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3"
                >
                  <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400 pt-4">
          Files are uploaded directly to the production team. No account required.
        </p>
      </div>
    </div>
  );
}
