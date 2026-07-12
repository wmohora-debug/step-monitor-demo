import { LoginForm } from "../../../src/features/auth/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Super Admin",
  description: "Secure administrator sign-in portal.",
};

export default function LoginPage() {
  return <LoginForm />;
}
