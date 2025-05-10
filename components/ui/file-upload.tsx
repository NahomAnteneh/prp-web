'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

export interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onChange: (files: File[]) => void;
  value?: File[];
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  disabled?: boolean;
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
}: FileUploadProps) {
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
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-md"
            >
              <div className="flex items-center space-x-2 truncate">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-muted rounded-md">
                  <span className="text-xs font-medium">
                    {file.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 