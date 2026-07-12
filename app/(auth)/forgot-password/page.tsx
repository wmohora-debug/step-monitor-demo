import { ForgotPasswordForm } from "../../../src/features/auth/components/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Super Admin",
  description: "Recover administrative access to your account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
