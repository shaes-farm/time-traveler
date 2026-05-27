import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Card, CardContent, CardHeader } from "./card";

export interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared chrome for all auth pages — centered single-column card with
 * product logo + name at the top. No Shell (sidebar / header).
 */
export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-background px-4 py-12",
        className,
      )}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Clock className="h-5 w-5" aria-hidden />
          </div>
          <span className="font-display text-xl text-foreground">
            Time Traveler
          </span>
        </div>

        <Card>
          <CardHeader className="pb-4" />
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
