import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { toast } from "sonner";
import { ZOHO_BASE_URL } from "@/lib/config/api";

// 1. Update User Role
interface UpdateRolePayload {
  username: string;
  newRole: string;
}

const updateUserRole = async (payload: UpdateRolePayload) => {
  return fetcher(`${ZOHO_BASE_URL}/users/update_role`, {
    method: "POST",
    body: JSON.stringify({
      newRole: payload.newRole,
      username: payload.username,
    }),
  });
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
  return fetcher(`${ZOHO_BASE_URL}/users/reset`, {
    method: "POST",
    body: JSON.stringify({
      username: payload.username,
      newPassword: payload.newPassword,
    }),
  });
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

// 3. Create User
interface CreateUserPayload {
  username: string;
  password: string;
  role: string;
}

const createUser = async (payload: CreateUserPayload) => {
  return fetcher(`${ZOHO_BASE_URL}/users/signup`, {
    method: "POST",
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
      role: payload.role,
    }),
  });
};

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });
}

// 4. Delete User
interface DeleteUserPayload {
  username: string;
}

interface DeleteUserResponse {
  success: boolean;
  message: string;
}

const deleteUser = async (
  payload: DeleteUserPayload,
): Promise<DeleteUserResponse> => {
  return fetcher<DeleteUserResponse>(`${ZOHO_BASE_URL}/users/remove`, {
    method: "DELETE",
    body: JSON.stringify({
      username: payload.username,
    }),
  });
};

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<DeleteUserResponse, Error, DeleteUserPayload>({
    mutationFn: deleteUser,
    onMutate: async ({ username }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData(["admin-users"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["admin-users"], (old: any) => {
        if (!old) return old;
        return old.filter((user: any) => user.username !== username);
      });

      // Return a context object with the snapshotted value
      return { previousUsers };
    },
    onSuccess: (data, { username }) => {
      if (data.success) {
        toast.success(`User "${username}" deleted successfully.`);
      } else {
        toast.error(data.message || `Failed to delete user "${username}".`);
      }
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error, { username }, context) => {
      toast.error(`Failed to delete user "${username}": ${error.message}`);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
