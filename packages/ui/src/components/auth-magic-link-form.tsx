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

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type Values = z.infer<typeof schema>;

export interface AuthMagicLinkFormProps {
  action: (input: { email: string }) => Promise<AuthActionResult>;
  /** Pre-seed the error alert — useful for Storybook error stories. */
  initialError?: string;
  /** Render the post-submit success state immediately — useful for Storybook. */
  initialSuccess?: boolean;
}

export function AuthMagicLinkForm({
  action,
  initialError,
  initialSuccess,
}: AuthMagicLinkFormProps) {
  const [success, setSuccess] = useState(initialSuccess ?? false);
  const [serverError, setServerError] = useState<string | null>(
    initialError ?? null,
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: Values) {
    setServerError(null);
    const result = await action(values);
    if (result.ok) {
      setSuccess(true);
    } else {
      setServerError(result.error.message);
    }
  }

  if (success) {
    return (
      <div className="space-y-4 py-2 text-center">
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to your email address. It expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Magic link</h1>
        <p className="text-sm text-muted-foreground">
          {"We'll email you a sign-in link — no password needed"}
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending link…" : "Send magic link"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        <a
          href="/auth/login"
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </a>
      </p>
    </div>
  );
}
