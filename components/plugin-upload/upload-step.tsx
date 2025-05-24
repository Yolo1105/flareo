'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type UploadMethod = 'dockerfile' | 'image' | 'github';

export function UploadStep() {
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('dockerfile');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: Implement file upload logic
      console.log('Uploading file:', file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Choose Upload Method</h2>
        <RadioGroup
          value={uploadMethod}
          onValueChange={(value) => setUploadMethod(value as UploadMethod)}
          className="grid grid-cols-3 gap-4"
        >
          <Card className="p-4 cursor-pointer">
            <RadioGroupItem
              value="dockerfile"
              id="dockerfile"
              className="peer sr-only"
            />
            <Label
              htmlFor="dockerfile"
              className="flex flex-col items-center justify-center space-y-2 cursor-pointer"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">Dockerfile</span>
            </Label>
          </Card>

          <Card className="p-4 cursor-pointer">
            <RadioGroupItem
              value="image"
              id="image"
              className="peer sr-only"
            />
            <Label
              htmlFor="image"
              className="flex flex-col items-center justify-center space-y-2 cursor-pointer"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">Docker Image</span>
            </Label>
          </Card>

          <Card className="p-4 cursor-pointer">
            <RadioGroupItem
              value="github"
              id="github"
              className="peer sr-only"
            />
            <Label
              htmlFor="github"
              className="flex flex-col items-center justify-center space-y-2 cursor-pointer"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">GitHub</span>
            </Label>
          </Card>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        {uploadMethod === 'github' ? (
          <div className="space-y-2">
            <Label htmlFor="github-url">GitHub Repository URL</Label>
            <Input
              id="github-url"
              placeholder="https://github.com/username/repo"
              type="url"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="file-upload">
              {uploadMethod === 'dockerfile'
                ? 'Upload Dockerfile'
                : 'Upload Docker Image'}
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept={
                uploadMethod === 'dockerfile'
                  ? '.dockerfile,.Dockerfile'
                  : '.tar,.tar.gz'
              }
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
        )}
      </div>

      {isUploading && (
        <div className="text-sm text-muted-foreground">
          Uploading... Please wait.
        </div>
      )}
    </div>
  );
} 