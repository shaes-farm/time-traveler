import { AuthResetPasswordForm } from "@repo/ui/components/auth-reset-password-form";
import { resetPasswordAction } from "../_actions";

export default function ResetPasswordPage() {
  return <AuthResetPasswordForm action={resetPasswordAction} />;
}
