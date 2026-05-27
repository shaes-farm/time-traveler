"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert, AlertDescription } from "./alert";
import { Button } from "./button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import type { AuthActionResult } from "./auth-types";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof schema>;

export interface AuthUpdatePasswordFormProps {
  action: (input: { password: string }) => Promise<AuthActionResult>;
  /** Pre-seed the error alert — useful for Storybook error stories. */
  initialError?: string;
}

/**
 * Submitted from the password-reset email link. On success the Server
 * Action redirects to /dashboard.
 */
export function AuthUpdatePasswordForm({
  action,
  initialError,
}: AuthUpdatePasswordFormProps) {
  const [serverError, setServerError] = useState<string | null>(
    initialError ?? null,
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: Values) {
    setServerError(null);
    const result = await action({ password: values.password });
    // redirect() throws inside the server action so this await only
    // resolves on failure; handle the error message.
    if (!result.ok) {
      setServerError(result.error.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">New password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a password for your account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Set new password"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
