import { redirect } from "next/navigation";

export default function LegacyRideCreatePage() {
  redirect("/en/rides/new");
  return null;
}
