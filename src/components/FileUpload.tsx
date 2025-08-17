import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { TournamentData } from '@/types/tournament';

import { cn } from '@/lib/utils';

interface FileUploadProps {
  onDataUpload: (data: TournamentData[], columns: string[]) => void;
}

export default function FileUpload({ onDataUpload }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];

      const processedData: TournamentData[] = dataRows
        .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
        .map((row, index) => {
          const rowData: TournamentData = {};
          headers.forEach((header, colIndex) => {
            rowData[header] = row[colIndex] || '';
          });
          return rowData;
        });

      if (processedData.length === 0) {
        throw new Error('No valid data found in the Excel file');
      }

      onDataUpload(processedData, headers);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process Excel file');
    } finally {
      setUploading(false);
    }
  }, [onDataUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl bg-gradient-primary bg-clip-text text-transparent">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          Upload Tournament Results
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload your Excel file containing tournament rankings and player data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300",
            dragActive 
              ? "border-primary bg-primary/5 shadow-glow" 
              : "border-border hover:border-primary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className={cn(
            "mx-auto h-12 w-12 mb-4 transition-colors duration-300",
            dragActive ? "text-primary" : "text-muted-foreground"
          )} />
          <p className="text-lg font-medium mb-2">
            {dragActive ? "Drop your Excel file here" : "Drag and drop your Excel file"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse files
          </p>
          <Button 
            variant="tournament" 
            size="lg" 
            disabled={uploading}
            className="relative"
          >
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {uploading ? 'Processing...' : 'Choose File'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-slide-up">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="animate-slide-up border-tournament-success">
            <CheckCircle className="h-4 w-4 text-tournament-success" />
            <AlertDescription className="text-tournament-success">
              File uploaded successfully! You can now create categories and manage tournament results.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Supported formats: .xlsx, .xls</p>
          <p>• Maximum file size: 10MB</p>
          <p>• First row should contain column headers</p>
          <p>• Ensure data includes player names, rankings, and other relevant information</p>
        </div>
      </CardContent>
    </Card>
  );
}