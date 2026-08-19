import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  FileVideo,
  File,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { TicketEvidenceFile } from "../types";
import { useGetPresignedUploadUrlMutation } from "../ticketApi";

interface TicketEvidenceUploaderProps {
  files: TicketEvidenceFile[];
  onChange: (files: TicketEvidenceFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const ALLOWED_EXTENSIONS = [
  "png", "jpg", "jpeg", "gif",
  "pdf", "docx", "xlsx", "csv",
  "txt", "log", "zip", "mp4",
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const TicketEvidenceUploader: React.FC<TicketEvidenceUploaderProps> = ({
  files,
  onChange,
  maxFiles = 5,
  disabled = false,
}) => {
  const [getPresignedUrl] = useGetPresignedUploadUrlMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getFileIcon = (mimeType: string, fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif"].includes(ext)) {
      return <FileImage className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
    if (mimeType.startsWith("video/") || ext === "mp4") {
      return <FileVideo className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (["xlsx", "csv"].includes(ext)) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (["zip", "rar", "7z"].includes(ext)) {
      return <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0 || disabled) return;
    setUploadError(null);

    if (files.length + selectedFiles.length > maxFiles) {
      setUploadError(`You can attach a maximum of ${maxFiles} evidence files per ticket.`);
      return;
    }

    setIsUploading(true);
    const newFiles: TicketEvidenceFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setUploadError(`"${file.name}" is not an allowed format. Allowed: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`);
        setIsUploading(false);
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setUploadError(`"${file.name}" exceeds the 10 MB file size limit.`);
        setIsUploading(false);
        return;
      }

      try {
        // 1. Get presigned upload URL
        const res = await getPresignedUrl({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        }).unwrap();

        const uploadData = res.data;
        if (!uploadData) {
          throw new Error("Failed to get presigned upload URL");
        }

        const { uploadUrl, fileUrl, key } = uploadData;

        // 2. Direct upload if valid HTTP URL
        if (uploadUrl.startsWith("http")) {
          await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });
        }

        newFiles.push({
          key,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          url: fileUrl,
        });
      } catch (err: any) {
        setUploadError(`Failed to upload "${file.name}". Please try again.`);
        setIsUploading(false);
        return;
      }
    }

    onChange([...files, ...newFiles]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (key: string) => {
    if (disabled) return;
    onChange(files.filter((f) => f.key !== key));
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">
          Ticket Evidence Files <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <span className="text-[11px] font-medium text-slate-400">
          {files.length} / {maxFiles} files
        </span>
      </div>

      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {files.length < maxFiles && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (!disabled) handleFileSelect(e.dataTransfer.files);
          }}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
            isDragOver
              ? "border-indigo-500 bg-indigo-50/50"
              : "border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-slate-50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.gif,.pdf,.docx,.xlsx,.csv,.txt,.log,.zip,.mp4"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={disabled || isUploading}
          />

          <div className="flex flex-col items-center justify-center space-y-1.5">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-1" />
            ) : (
              <UploadCloud className="w-6 h-6 text-indigo-500 mb-1" />
            )}
            <p className="text-xs font-semibold text-slate-700">
              {isUploading ? "Uploading evidence..." : "Click or drag & drop files here to upload"}
            </p>
            <p className="text-[10px] text-slate-400">
              PNG, JPG, GIF, PDF, DOCX, XLSX, CSV, TXT, LOG, ZIP, MP4 (Max 10 MB per file)
            </p>
          </div>
        </div>
      )}

      {/* Uploaded File List Pills */}
      {files.length > 0 && (
        <div className="space-y-2 pt-1">
          {files.map((file) => (
            <div
              key={file.key}
              className="flex items-center justify-between p-2.5 bg-white border border-slate-200/90 rounded-xl text-xs shadow-2xs hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {getFileIcon(file.mimeType, file.originalName)}
                <span className="font-semibold text-slate-800 truncate" title={file.originalName}>
                  {file.originalName}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(file.key)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                  title="Remove evidence file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketEvidenceUploader;
