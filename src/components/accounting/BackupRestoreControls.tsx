"use client";

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useAccounting } from '@/context/AccountingContext';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function BackupRestoreControls() {
  const { backupData, restoreData } = useAccounting();
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const jsonData = e.target?.result as string;
        const success = await restoreData(jsonData);
        if (success) {
          setIsRestoreConfirmOpen(false); // Close outer dialog if needed, though this is inner confirm
        }
      };
      reader.readAsText(file);
    }
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  }

  return (
    <Card className="mt-8 shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Data Management</CardTitle>
        <CardDescription>Backup your data to a file or restore from a previous backup.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        <Button onClick={backupData} variant="outline" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" /> Backup Now
        </Button>

        <AlertDialog open={isRestoreConfirmOpen} onOpenChange={setIsRestoreConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" /> Restore Backup
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Restoring from a backup will overwrite all current data. This action cannot be undone. 
                Please ensure you have selected the correct backup file.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="backupFile" className="sr-only">Backup file</Label>
              <Input
                id="backupFile"
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" // Hidden, triggered by button
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={triggerFileInput}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Choose File & Restore
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
