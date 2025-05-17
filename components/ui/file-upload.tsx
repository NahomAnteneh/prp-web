'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, X, FileIcon } from 'lucide-react';

export interface FileUploadProps {
  value?: File[];
  onChange: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // In bytes
  disabled?: boolean;
  accept?: Record<string, string[]>;
  className?: string;
}

export function FileUpload({
  onChange,
  value = [],
  multiple = false,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept,
  disabled = false,
  className,
  ...props
}: FileUploadProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>) {
  const [files, setFiles] = React.useState<File[]>(value);

  React.useEffect(() => {
    setFiles(value);
  }, [value]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = multiple ? [...files, ...acceptedFiles] : acceptedFiles;
      setFiles(newFiles);
      onChange(newFiles);
    },
    [files, multiple, onChange]
  );

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    multiple,
    maxFiles,
    maxSize,
    accept,
    disabled,
  });

  return (
    <div className={cn('space-y-4', className)} {...props}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <div className="mb-2 font-medium">
            <span className="text-primary">Click to upload</span> or drag and drop
          </div>
          <p className="text-sm text-muted-foreground">
            {multiple ? 'Upload files' : 'Upload a file'}
          </p>
          {maxSize && (
            <p className="text-xs text-muted-foreground mt-1">
              Max file size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          )}
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="text-sm text-red-500">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="mt-2">
              <p>{file.name} - {file.size} bytes</p>
              <ul className="list-disc pl-5">
                {errors.map((error) => (
                  <li key={error.code}>{error.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-muted p-3 rounded-md text-sm"
            >
              <div className="flex items-center space-x-2 overflow-hidden">
                <FileIcon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-muted-foreground">
                  ({Math.round(file.size / 1024)} KB)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeFile(i)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 