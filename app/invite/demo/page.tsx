import { redirect } from "next/navigation";

/** Old demo guest URL — send people to the live app. */
export default function InviteDemoRedirectPage() {
    redirect("/gate");
}
