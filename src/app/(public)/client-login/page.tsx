import { redirect } from "next/navigation";

export default function ClientLoginPage() {
  redirect("/auth/user/login");
}