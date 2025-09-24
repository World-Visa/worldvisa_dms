'use client';

import React, { memo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { UserRoleSelect } from './UserRoleSelect';

interface CreateUserDialogProps {
  onCreateUser: (userData: {
    username: string;
    password: string;
    role: string;
  }) => void;
  isCreating?: boolean;
}

export const CreateUserDialog = memo(function CreateUserDialog({
  onCreateUser,
  isCreating = false,
}: CreateUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleCreate = () => {
    if (!username.trim() || !password.trim() || password !== confirmPassword) {
      console.error('Invalid input or passwords do not match');
      return;
    }
    
    onCreateUser({
      username: username.trim(),
      password,
      role,
    });
    
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setRole('admin');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const isFormValid = 
    username.trim() && 
    password.trim() && 
    confirmPassword.trim() && 
    password === confirmPassword;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add New User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isCreating}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isCreating}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isCreating}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isCreating}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <UserRoleSelect
              currentRole={role}
              onRoleChange={setRole}
              disabled={isCreating}
            />
          </div>

          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-sm text-red-600">
              Passwords do not match
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!isFormValid || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
