'use client';

import React, { memo, useCallback } from 'react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAuth } from '@/hooks/useAuth';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import our new components
import { UserTable } from './UserTable';
import { CreateUserDialog } from './CreateUserDialog';
import { DeleteUserDialog } from './DeleteUserDialog';
import { LoadingState, ErrorState, EmptyState } from './UserManagementStates';

const ManageUsers = memo(function ManageUsers() {
  const { user } = useAuth();
  const {
    data: adminUsers,
    isLoading: isLoadingAdmins,
    error: adminError,
    refetch,
  } = useAdminUsers();

  const {
    isDeleteDialogOpen,
    userToDelete,
    handleRoleChange,
    handleCreateUser,
    handleResetPassword,
    confirmDeleteUser,
    openDeleteDialog,
    closeDeleteDialog,
    isUpdatingRole,
    isCreatingUser,
    isResettingPassword,
    isDeletingUser,
  } = useUserManagement();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Loading state
  if (isLoadingAdmins) {
    return <LoadingState />;
  }

  // Error state
  if (adminError) {
    return <ErrorState error={adminError} onRetry={handleRefresh} />;
  }

  // Empty state
  if (!adminUsers || adminUsers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <CreateUserDialog
            onCreateUser={handleCreateUser}
            isCreating={isCreatingUser}
          />
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingAdmins}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingAdmins ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <CreateUserDialog
            onCreateUser={handleCreateUser}
            isCreating={isCreatingUser}
          />
        </div>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Users
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({adminUsers.length} user{adminUsers.length !== 1 ? 's' : ''})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable
            users={adminUsers}
            currentUser={user}
            onRoleChange={handleRoleChange}
            onResetPassword={handleResetPassword}
            onDeleteUser={openDeleteDialog}
            isUpdatingRole={isUpdatingRole}
            isResettingPassword={isResettingPassword}
            isDeletingUser={isDeletingUser}
          />
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        username={userToDelete}
        onConfirm={confirmDeleteUser}
        isDeleting={isDeletingUser}
      />
    </div>
  );
});

export default ManageUsers;
