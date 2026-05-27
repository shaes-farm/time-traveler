import { AuthMagicLinkForm } from "@repo/ui/components/auth-magic-link-form";
import { signInWithMagicLinkAction } from "../_actions";

export default function MagicLinkPage() {
  return <AuthMagicLinkForm action={signInWithMagicLinkAction} />;
}
