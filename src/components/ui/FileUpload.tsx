
import React, { useState, useRef } from 'react';
import { FileUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileUploadState } from '@/types';

interface FileUploadProps {
  onUploadComplete: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!validTypes.includes(file.type)) {
      setState({
        ...state,
        error: 'Please upload a CSV or Excel file.',
        isUploading: false,
      });
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV or Excel file.',
        variant: 'destructive',
      });
      return;
    }

    handleUpload(file);
  };

  const handleUpload = (file: File) => {
    setState({
      ...state,
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
    });

    // Simulate file upload with progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setState((prev) => ({
        ...prev,
        progress,
      }));

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setState({
            isUploading: false,
            progress: 100,
            error: null,
            success: true,
          });
          
          toast({
            title: 'Upload successful',
            description: 'Your file has been processed successfully.',
          });
          
          onUploadComplete();
        }, 500);
      }
    }, 150);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!validTypes.includes(file.type)) {
      setState({
        ...state,
        error: 'Please upload a CSV or Excel file.',
        isUploading: false,
      });
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV or Excel file.',
        variant: 'destructive',
      });
      return;
    }
    
    handleUpload(file);
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative glass-card p-12 transition-all flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 ${
          state.isUploading ? 'border-primary/50 bg-secondary/50' : 'border-border'
        } ${state.success ? 'border-green-500/30 bg-green-50/20' : ''} ${
          state.error ? 'border-red-500/30 bg-red-50/20' : ''
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          ref={fileInputRef}
        />

        <div className="text-center space-y-4">
          {state.isUploading ? (
            <div className="animate-fade-in flex flex-col items-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-medium">Processing your data...</h3>
              <p className="text-muted-foreground mb-6">Please wait while we generate insights</p>
              <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300" 
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">{state.progress}%</p>
            </div>
          ) : state.success ? (
            <div className="animate-fade-in flex flex-col items-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium">Upload Complete!</h3>
              <p className="text-muted-foreground">Your data has been processed successfully</p>
            </div>
          ) : state.error ? (
            <div className="animate-fade-in flex flex-col items-center">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-medium">Upload Failed</h3>
              <p className="text-red-500">{state.error}</p>
              <p className="text-muted-foreground mt-2">Please try again</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <FileUp className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-medium">Drag & Drop Your User Data</h3>
              <p className="text-muted-foreground mb-6">or click to browse files</p>
              <p className="text-xs text-muted-foreground">Supports CSV and Excel files</p>
              <p className="text-xs text-muted-foreground">Your data is processed privately and deleted immediately for security</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
