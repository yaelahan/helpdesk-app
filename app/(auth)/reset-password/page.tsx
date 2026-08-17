import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Choose new password · HelpdeskApp" };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
