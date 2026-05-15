'use client';

import type { ReactNode } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  placeholder?: string;
  addLabel: string;
  onAdd: () => void;
}

export function AdminToolbar({ search, onSearchChange, placeholder = 'Cari...', addLabel, onAdd }: AdminToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button onClick={onAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm">
        <Plus className="w-4 h-4" />
        {addLabel}
      </Button>
    </div>
  );
}

interface AdminEmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

export function AdminEmptyState({ icon: Icon, title, description }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs mt-1">{description}</p>
    </div>
  );
}

interface AdminDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}

export function AdminDeleteDialog({ open, onOpenChange, title, description, onConfirm }: AdminDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-64" />
      </div>
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );
}
