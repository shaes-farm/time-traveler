import { AuthLoginForm } from "@repo/ui/components/auth-login-form";
import { signInAction } from "../_actions";

export default function LoginPage() {
  return <AuthLoginForm action={signInAction} />;
}
