'use client';

import React, { memo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { User } from '@/types/user';
import { UserRoleSelect } from './UserRoleSelect';
import { ResetPasswordDialog } from './ResetPasswordDialog';

interface UserTableProps {
  users: User[];
  currentUser: User | null;
  onRoleChange: (username: string, newRole: string) => void;
  onResetPassword: (username: string, newPassword: string) => void;
  onDeleteUser: (username: string) => void;
  isUpdatingRole: boolean;
  isResettingPassword: boolean;
  isDeletingUser: boolean;
}

export const UserTable = memo(function UserTable({
  users,
  currentUser,
  onRoleChange,
  onResetPassword,
  onDeleteUser,
  isUpdatingRole,
  isResettingPassword,
  isDeletingUser,
}: UserTableProps) {
  const isMasterAdmin = currentUser?.role === 'master_admin';
  
  const isDeletingSelf = useCallback((username: string) => 
    currentUser?.username === username, 
    [currentUser?.username]
  );

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No users found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Change Role</TableHead>
          <TableHead>Reset Password</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user._id}>
            <TableCell className="font-medium">
              {user.username}
            </TableCell>
            <TableCell className="font-semibold capitalize">
              {user.role.replace('_', ' ')}
            </TableCell>
            <TableCell>
              <UserRoleSelect
                currentRole={user.role}
                onRoleChange={(newRole) => onRoleChange(user.username, newRole)}
                disabled={isUpdatingRole}
              />
            </TableCell>
            <TableCell>
              <ResetPasswordDialog
                username={user.username}
                onResetPassword={onResetPassword}
                isResetting={isResettingPassword}
              />
            </TableCell>
            <TableCell className="text-center">
              {isMasterAdmin ? (
                isDeletingSelf(user.username) ? (
                  <span className="text-sm text-gray-500 italic">
                    Cannot Delete Self
                  </span>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteUser(user.username)}
                    disabled={isDeletingUser}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )
              ) : (
                <span className="text-sm text-gray-500 italic">
                  Master Admin Only
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});
