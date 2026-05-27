import { AuthRegisterForm } from "@repo/ui/components/auth-register-form";
import { signUpAction } from "../_actions";

export default function RegisterPage() {
  return <AuthRegisterForm action={signUpAction} />;
}
