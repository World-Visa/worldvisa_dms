import { useAdminUsers } from "@/hooks/useAdminUsers";
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
import {
  useUpdateUserRole,
  useResetUserPassword,
} from "@/hooks/useUserMutations";
import { Toaster } from "@/components/ui/sonner";

function ManageUsers() {
  const {
    data: adminUsers,
    isLoading: isLoadingAdmins,
    error: adminError,
  } = useAdminUsers();

  const { mutate: updateUserRole, isPending: isUpdatingRole } =
    useUpdateUserRole();
  const { mutate: resetUserPassword, isPending: isResettingPassword } =
    useResetUserPassword();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  if (isLoadingAdmins) return <div>Loading...</div>;
  if (adminError) return <div>Error loading users</div>;

  return (
    <div>
      <Toaster />
      <h1>Manage Users</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Change Role</TableHead>
            <TableHead>Reset Password</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adminUsers &&
            adminUsers.length > 0 &&
            adminUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="uppercase font-medium">
                  {user.username}
                </TableCell>
                <TableCell className="font-semibold">{user.role}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={user.role}
                    onValueChange={(value) =>
                      handleRoleChange(user.username, value)
                    }
                    disabled={isUpdatingRole}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent
                      className="font-medium"
                      defaultValue={user.role}
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
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="font-medium">
                  <Dialog
                    open={isDialogOpen && selectedUser === user.username}
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
                      <Button onClick={() => setSelectedUser(user.username)}>
                        Reset Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Reset Password for {user.username}
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
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ManageUsers;
