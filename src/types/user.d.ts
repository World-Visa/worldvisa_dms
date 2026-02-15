export interface UserProfile {
  _id: string;
  username?: string;
  email?: string;
  role: "admin" | "client";
  lead_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
}
