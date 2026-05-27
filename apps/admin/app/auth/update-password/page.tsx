import { AuthUpdatePasswordForm } from "@repo/ui/components/auth-update-password-form";
import { updatePasswordAction } from "../_actions";

export default function UpdatePasswordPage() {
  return <AuthUpdatePasswordForm action={updatePasswordAction} />;
}
