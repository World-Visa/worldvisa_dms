import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  useUpdateUserRole,
  useResetUserPassword,
  useCreateUser,
  useDeleteUser,
} from "@/hooks/useUserMutations";
import { Toaster } from "@/components/ui/sonner";

function ManageUsers() {
  const { user } = useAuth();
  const {
    data: adminUsers,
    isLoading: isLoadingAdmins,
    error: adminError,
  } = useAdminUsers();

  const { mutate: updateUserRole, isPending: isUpdatingRole } =
    useUpdateUserRole();
  const { mutate: resetUserPassword, isPending: isResettingPassword } =
    useResetUserPassword();
  const { mutate: createUser, isPending: isCreatingUser } = useCreateUser();
  const { mutate: deleteUser, isPending: isDeletingUser } = useDeleteUser();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserRole, setNewUserRole] = useState("admin");

  const handleRoleChange = (username: string, newRole: string) => {
    updateUserRole({ username, newRole });
  };

  const handleResetPassword = () => {
    if (newPassword !== confirmPassword) {
      console.error("Passwords do not match");
      return;
    }
    if (selectedUser) {
      resetUserPassword(
        { username: selectedUser, newPassword },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setNewPassword("");
            setConfirmPassword("");
            setSelectedUser(null);
          },
        }
      );
    }
  };

  const handleCreateUser = () => {
    if (!newUsername || !newPassword || newPassword !== confirmPassword) {
      console.error("Invalid input or passwords do not match");
      return;
    }
    createUser(
      { username: newUsername, password: newPassword, role: newUserRole },
      {
        onSuccess: () => {
          setNewUsername("");
          setNewPassword("");
          setConfirmPassword("");
          setIsDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUser(
        { username: userToDelete },
        {
          onSuccess: () => {
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
          },
          onError: () => {
            // Error handling is done in the hook
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
          },
        }
      );
    }
  };

  const openDeleteDialog = (username: string) => {
    setUserToDelete(username);
    setIsDeleteDialogOpen(true);
  };

  // Check if current user is master-admin
  const isMasterAdmin = user?.role === 'master_admin';
  
  // Check if user is trying to delete themselves
  const isDeletingSelf = (username: string) => user?.username === username;

  if (isLoadingAdmins) return <div>Loading...</div>;
  if (adminError) return <div>Error loading users</div>;

  return (
    <div>
      <Toaster />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="cursor-pointer">Add a New User</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            <Select defaultValue={newUserRole} onValueChange={setNewUserRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="font-medium">
                <SelectItem className="font-semibold" value="master_admin">
                  Master Admin
                </SelectItem>
                <SelectItem className="font-semibold" value="admin">
                  Admin
                </SelectItem>
                <SelectItem className="font-semibold" value="team_leader">
                  Team Leader
                </SelectItem>
                <SelectItem className="font-semibold" value="supervisor">
                  Supervisor
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateUser} disabled={isCreatingUser}>
              {isCreatingUser ? "Creating..." : "Create User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">
                  Are you sure you want to delete user &quot;{userToDelete}&quot;?
                </p>
                <p className="text-sm text-red-600 mt-1">
                  This action cannot be undone. The user will be permanently removed from the system.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setUserToDelete(null);
                }}
                disabled={isDeletingUser}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={isDeletingUser}
                className="flex items-center gap-2"
              >
                {isDeletingUser ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete User
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          {adminUsers &&
            adminUsers.length > 0 &&
            adminUsers.map((adminUser) => (
              <TableRow key={adminUser._id}>
                <TableCell className="uppercase font-medium">
                  {adminUser.username}
                </TableCell>
                <TableCell className="font-semibold">{adminUser.role}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={adminUser.role}
                    onValueChange={(value) =>
                      handleRoleChange(adminUser.username, value)
                    }
                    disabled={isUpdatingRole}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent
                      className="font-medium"
                      defaultValue={adminUser.role}
                    >
                      <SelectItem
                        className="font-semibold"
                        value="master_admin"
                      >
                        Master Admin
                      </SelectItem>
                      <SelectItem className="font-semibold" value="admin">
                        Admin
                      </SelectItem>
                      <SelectItem className="font-semibold" value="team_leader">
                        Team Leader
                      </SelectItem>
                      <SelectItem className="font-semibold" value="supervisor">
                        Supervisor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="font-medium">
                  <Dialog
                    open={isDialogOpen && selectedUser === adminUser.username}
                    onOpenChange={(isOpen) => {
                      setIsDialogOpen(isOpen);
                      if (!isOpen) {
                        setSelectedUser(null);
                        setNewPassword("");
                        setConfirmPassword("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedUser(adminUser.username)}>
                        Reset Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Reset Password for {adminUser.username}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        <Button
                          onClick={handleResetPassword}
                          disabled={isResettingPassword}
                        >
                          {isResettingPassword ? "Resetting..." : "Reset"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell className="text-center">
                  {isMasterAdmin ? (
                    isDeletingSelf(adminUser.username) ? (
                      <span className="text-sm text-gray-500 italic">
                        Cannot Delete Self
                      </span>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(adminUser.username)}
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
    </div>
  );
}

export default ManageUsers;
