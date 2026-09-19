import { redirect } from "next/navigation";

/** Legacy URL — product app lives at /gate */
export default function SmartGateDemoRedirectPage() {
  redirect("/gate");
}
