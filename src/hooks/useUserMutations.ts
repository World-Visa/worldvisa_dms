import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { toast } from "sonner";

// 1. Update User Role
interface UpdateRolePayload {
  username: string;
  newRole: string;
}

const updateUserRole = async (payload: UpdateRolePayload) => {
  return fetcher(
    `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/users/update_role`,
    {
      method: "POST",
      body: JSON.stringify({
        newRole: payload.newRole,
        username: payload.username,
      }),
    }
  );
};

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      toast.success("User role updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user role: ${error.message}`);
    },
  });
}

// 2. Reset User Password
interface ResetPasswordPayload {
  username: string;
  newPassword: string;
}

const resetUserPassword = async (payload: ResetPasswordPayload) => {
  return fetcher(
    "https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/users/reset",
    {
      method: "POST",
      body: JSON.stringify({
        username: payload.username,
        newPassword: payload.newPassword,
      }),
    }
  );
};

export function useResetUserPassword() {
  return useMutation({
    mutationFn: resetUserPassword,
    onSuccess: () => {
      toast.success("Password reset successfully.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset password: ${error.message}`);
    },
  });
}
