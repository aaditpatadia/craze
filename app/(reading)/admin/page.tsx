import { redirect } from "next/navigation";

/** The founder desk moved to /team. */
export default function AdminPage() {
  redirect("/team");
}
