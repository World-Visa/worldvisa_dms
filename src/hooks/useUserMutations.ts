import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { getClerkToken } from "@/lib/getToken";
import { toast } from "sonner";
import { ZOHO_BASE_URL, API_ENDPOINTS } from "@/lib/config/api";
import type { AccountStatus } from "@/hooks/useAdminUsersV2";

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
  username?: string;
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
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      const previousUsers = queryClient.getQueryData(["admin-users"]);
      queryClient.setQueryData(["admin-users"], (old: any) => {
        if (!old) return old;
        return old.filter((user: any) => user.username !== username);
      });
      return { previousUsers };
    },
    onSuccess: (data, { username }) => {
      if (data.success) {
        toast.success(`User "${username}" deleted successfully.`);
      } else {
        toast.error(data.message || `Failed to delete user "${username}".`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-v2"] });
    },
    onError: (error: Error, { username }) => {
      toast.error(`Failed to delete user "${username}": ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-v2"] });
    },
  });
}

// 5. Upload Profile Image
const uploadProfileImage = async (file: File): Promise<void> => {
  const token = await getClerkToken();
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${ZOHO_BASE_URL}/users/profile-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "Upload failed");
    throw new Error(msg);
  }
};

export function useUploadProfileImage(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-details", userId] });
      toast.success("Profile image updated.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload image: ${error.message}`);
    },
  });
}

// 6. Update User Status
interface UpdateStatusPayload {
  username: string;
  account_status: AccountStatus;
}

const updateUserStatus = async (payload: UpdateStatusPayload) => {
  return fetcher(API_ENDPOINTS.USERS.UPDATE_ROLE, {
    method: "POST",
    body: JSON.stringify({
      username: payload.username,
      account_status: payload.account_status,
    }),
  });
};

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      toast.success("User status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-users-v2"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}

// 7. Invite User (creates new admin user via Clerk)
interface InviteUserPayload {
  email: string;
  role: string;
  username: string;
}

const inviteUser = async (payload: InviteUserPayload) => {
  return fetcher(API_ENDPOINTS.USERS.INVITE, {
    method: "POST",
    body: JSON.stringify({ ...payload, type: "new-admin" }),
  });
};

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      toast.success("Invitation sent successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-users-v2"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    },
  });
}

// 8. Check username/email availability
interface AvailabilityResult {
  username?: boolean;
  email?: boolean;
}

export async function checkAvailability(params: {
  username?: string;
  email?: string;
}): Promise<AvailabilityResult> {
  const query = new URLSearchParams();
  if (params.username) query.set("username", params.username);
  if (params.email) query.set("email", params.email);
  return fetcher<AvailabilityResult>(
    `${API_ENDPOINTS.USERS.CHECK_AVAILABILITY}?${query.toString()}`,
  );
}

// 9. Revoke Invitation
interface RevokeInvitationPayload {
  invitationId: string;
}

const revokeInvitation = async (payload: RevokeInvitationPayload) => {
  return fetcher(`${API_ENDPOINTS.USERS.INVITE}?invitationId=${encodeURIComponent(payload.invitationId)}`, {
    method: "DELETE",
  });
};

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      toast.success("Invitation revoked.");
      queryClient.invalidateQueries({ queryKey: ["admin-users-v2"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke invitation: ${error.message}`);
    },
  });
}

export function useRevokeClientInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      toast.success("Invitation revoked.");
      queryClient.invalidateQueries({ queryKey: ["clients-v2"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke invitation: ${error.message}`);
    },
  });
}

// 9. Migrate existing user to Clerk (email-only invite)
const migrateUserToClerk = async (email: string) => {
  return fetcher(API_ENDPOINTS.USERS.INVITE, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export function useMigrateUserToClerk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: migrateUserToClerk,
    onSuccess: () => {
      toast.success("Migration invite sent. The user will receive an email to set up their account.");
      queryClient.invalidateQueries({ queryKey: ["admin-users-v2"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send migration invite: ${error.message}`);
    },
  });
}

// 10. Invite existing DMS client to portal (Clerk invite)
export function useInviteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      fetcher(API_ENDPOINTS.CLIENTS.INVITE, {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => {
      toast.success("Portal invite sent. The client will receive an email to access the DMS portal.");
      queryClient.invalidateQueries({ queryKey: ["clients-v2"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send portal invite: ${error.message}`);
    },
  });
}
