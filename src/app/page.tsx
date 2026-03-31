import { redirect } from "next/navigation";
import { ROUTES } from "@/utils/routes";

export default function Home() {
  redirect(ROUTES.SIGN_IN);
}
