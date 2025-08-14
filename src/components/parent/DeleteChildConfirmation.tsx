import React from 'react';
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
import { Child } from '@/pages/parent/ParentDashboard';

interface DeleteChildConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  child: Child;
  isDeleting: boolean;
}

const DeleteChildConfirmation: React.FC<DeleteChildConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  child,
  isDeleting
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Child Profile</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{child?.fullName}</strong>'s profile? 
            This action cannot be undone and will remove all associated data including ride history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteChildConfirmation;
