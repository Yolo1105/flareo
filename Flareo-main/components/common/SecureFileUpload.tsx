import React, { useState, useCallback, useRef } from 'react';
import { isValidFileType, isValidFileSize } from '@/lib/security';

interface SecureFileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string[];
  maxSize?: number; // MB
  multiple?: boolean;
  className?: string;
  preview?: boolean;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  onUpload,
  accept = ['image/jpeg', 'image/png', 'image/gif'],
  maxSize = 5,
  multiple = false,
  className = '',
  preview = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    // 检查文件类型
    if (!isValidFileType(file, accept)) {
      setError(`不支持的文件类型。允许的类型: ${accept.join(', ')}`);
      return false;
    }

    // 检查文件大小
    if (!isValidFileSize(file, maxSize)) {
      setError(`文件大小不能超过 ${maxSize}MB`);
      return false;
    }

    return true;
  }, [accept, maxSize]);

  const handleFile = useCallback(async (file: File) => {
    setError('');

    if (!validateFile(file)) {
      return;
    }

    // 生成预览
    if (preview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // 上传文件
    try {
      setIsUploading(true);
      await onUpload(file);
    } catch (error) {
      setError('文件上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, preview, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${className}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(',')}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="text-center">
          {previewUrl ? (
            <div className="mb-4">
              <img
                src={previewUrl}
                alt="预览"
                className="max-h-48 mx-auto rounded"
              />
            </div>
          ) : (
            <div className="text-gray-500">
              <p className="mb-2">点击或拖拽文件到此处上传</p>
              <p className="text-sm">
                支持的文件类型: {accept.join(', ')}
                <br />
                最大文件大小: {maxSize}MB
              </p>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-red-500 text-sm" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}; 