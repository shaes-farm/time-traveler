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
  password: z.string().min(1, "Password is required"),
});

type Values = z.infer<typeof schema>;

export interface AuthLoginFormProps {
  action: (input: {
    email: string;
    password: string;
  }) => Promise<AuthActionResult>;
  /** Pre-seed the error alert — useful for Storybook error stories. */
  initialError?: string;
}

/**
 * Login form — email + password with magic-link, register, and
 * forgot-password navigation links.
 *
 * On signIn success the Server Action calls redirect(); the component
 * only handles the failure path.
 */
export function AuthLoginForm({ action, initialError }: AuthLoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(
    initialError ?? null,
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: Values) {
    setServerError(null);
    const result = await action(values);
    // ok === true means the server action redirected; this branch only
    // runs if something unexpected returned without redirecting.
    if (!result.ok) {
      setServerError(result.error.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <a
                    href="/auth/reset-password"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </a>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>
          <a
            href="/auth/magic-link"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Sign in with a magic link
          </a>
        </p>
        <p>
          {"No account? "}
          <a
            href="/auth/register"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
