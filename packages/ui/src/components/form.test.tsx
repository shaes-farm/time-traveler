import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "./form";

type Values = {
  email: string;
};

function HookProbe() {
  useFormField();
  return null;
}

function MissingFormFieldHarness() {
  const form = useForm<Values>({ defaultValues: { email: "" } });

  return (
    <Form {...form}>
      <HookProbe />
    </Form>
  );
}

function MissingFormItemHarness() {
  const form = useForm<Values>({ defaultValues: { email: "" } });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="email"
        render={() => <HookProbe />}
      />
    </Form>
  );
}

function FormHarness({ messageChildren }: { messageChildren?: ReactNode }) {
  const form = useForm<Values>({ defaultValues: { email: "" } });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})}>
        <FormField
          control={form.control}
          name="email"
          rules={{ required: "Email is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <input type="email" {...field} />
              </FormControl>
              <FormDescription>Helpful hint</FormDescription>
              <FormMessage data-testid="message">{messageChildren}</FormMessage>
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}

describe("form primitives", () => {
  it("throws when useFormField is used outside FormField", () => {
    expect(() => render(<MissingFormFieldHarness />)).toThrow(
      "useFormField should be used within <FormField>",
    );
  });

  it("throws when useFormField is used outside FormItem", () => {
    expect(() => render(<MissingFormItemHarness />)).toThrow(
      "useFormField should be used within <FormItem>",
    );
  });

  it("wires label, described-by, and empty message state when valid", () => {
    render(<FormHarness />);

    const input = screen.getByRole("textbox", { name: "Email" });
    const label = screen.getByText("Email");

    expect(label).toHaveAttribute("for", input.getAttribute("id"));
    expect(input).toHaveAttribute("aria-invalid", "false");

    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const describedByIds = (describedBy ?? "").split(" ");
    expect(describedByIds).toHaveLength(1);
    const firstDescribedById = describedByIds[0];
    expect(firstDescribedById).toBeDefined();
    if (!firstDescribedById) {
      throw new Error("Expected aria-describedby to contain one id");
    }
    expect(document.getElementById(firstDescribedById)).toHaveTextContent(
      "Helpful hint",
    );

    expect(screen.queryByTestId("message")).not.toBeInTheDocument();
  });

  it("renders custom message children when no error exists", () => {
    render(<FormHarness messageChildren="Custom helper" />);

    expect(screen.getByTestId("message")).toHaveTextContent("Custom helper");
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });

  it("switches aria wiring to include error message on validation failure", async () => {
    const user = userEvent.setup();
    render(<FormHarness />);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    const errorText = await screen.findByText("Email is required");
    const input = screen.getByRole("textbox", { name: "Email" });
    const label = screen.getByText("Email");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(label.className).toContain("text-destructive");

    await waitFor(() => {
      const ids = (input.getAttribute("aria-describedby") ?? "").split(" ");
      expect(ids).toHaveLength(2);
      const resolved = ids
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ");
      expect(resolved).toContain("Helpful hint");
      expect(resolved).toContain("Email is required");
    });

    expect(errorText).toBeInTheDocument();
  });
});
