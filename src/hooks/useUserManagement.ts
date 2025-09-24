import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  useUpdateUserRole,
  useResetUserPassword,
  useCreateUser,
  useDeleteUser,
} from './useUserMutations';

interface UseUserManagementReturn {
  // State
  isDeleteDialogOpen: boolean;
  userToDelete: string | null;
  
  // Actions
  handleRoleChange: (username: string, newRole: string) => void;
  handleCreateUser: (userData: {
    username: string;
    password: string;
    role: string;
  }) => void;
  handleResetPassword: (username: string, newPassword: string) => void;
  handleDeleteUser: (username: string) => void;
  confirmDeleteUser: () => void;
  openDeleteDialog: (username: string) => void;
  closeDeleteDialog: () => void;
  
  // Loading states
  isUpdatingRole: boolean;
  isCreatingUser: boolean;
  isResettingPassword: boolean;
  isDeletingUser: boolean;
}

export function useUserManagement(): UseUserManagementReturn {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const { mutate: updateUserRole, isPending: isUpdatingRole } = useUpdateUserRole();
  const { mutate: resetUserPassword, isPending: isResettingPassword } = useResetUserPassword();
  const { mutate: createUser, isPending: isCreatingUser } = useCreateUser();
  const { mutate: deleteUser, isPending: isDeletingUser } = useDeleteUser();

  const handleRoleChange = useCallback((username: string, newRole: string) => {
    updateUserRole(
      { username, newRole },
      {
        onSuccess: () => {
          toast.success(`User role updated successfully`);
        },
        onError: (error) => {
          toast.error(`Failed to update user role: ${error.message}`);
        },
      }
    );
  }, [updateUserRole]);

  const handleCreateUser = useCallback((userData: {
    username: string;
    password: string;
    role: string;
  }) => {
    createUser(userData, {
      onSuccess: () => {
        toast.success('User created successfully');
      },
      onError: (error) => {
        toast.error(`Failed to create user: ${error.message}`);
      },
    });
  }, [createUser]);

  const handleResetPassword = useCallback((username: string, newPassword: string) => {
    resetUserPassword(
      { username, newPassword },
      {
        onSuccess: () => {
          toast.success('Password reset successfully');
        },
        onError: (error) => {
          toast.error(`Failed to reset password: ${error.message}`);
        },
      }
    );
  }, [resetUserPassword]);

  const handleDeleteUser = useCallback((username: string) => {
    setUserToDelete(username);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDeleteUser = useCallback(() => {
    if (userToDelete) {
      deleteUser(
        { username: userToDelete },
        {
          onSuccess: () => {
            toast.success('User deleted successfully');
            closeDeleteDialog();
          },
          onError: (error) => {
            toast.error(`Failed to delete user: ${error.message}`);
            closeDeleteDialog();
          },
        }
      );
    }
  }, [deleteUser, userToDelete]);

  const openDeleteDialog = useCallback((username: string) => {
    setUserToDelete(username);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  }, []);

  return {
    // State
    isDeleteDialogOpen,
    userToDelete,
    
    // Actions
    handleRoleChange,
    handleCreateUser,
    handleResetPassword,
    handleDeleteUser,
    confirmDeleteUser,
    openDeleteDialog,
    closeDeleteDialog,
    
    // Loading states
    isUpdatingRole,
    isCreatingUser,
    isResettingPassword,
    isDeletingUser,
  };
}
