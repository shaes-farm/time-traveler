import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReaderStoryCard, type ReaderStoryCardData } from "./reader-story-card";

const BASE: ReaderStoryCardData = {
  title: "A Walk Through Rome",
  subTitle: "One day in 50 BCE",
  summary: "A first-person stroll across the late Republic.",
  narratorType: "first_person",
};

describe("ReaderStoryCard", () => {
  it("links the title to the given href", () => {
    render(<ReaderStoryCard story={BASE} href="/stories" />);
    expect(
      screen.getByRole("link", { name: "A Walk Through Rome" }),
    ).toHaveAttribute("href", "/stories");
  });

  it("renders subtitle and summary when present", () => {
    render(<ReaderStoryCard story={BASE} href="/stories" />);
    expect(screen.getByText("One day in 50 BCE")).toBeInTheDocument();
    expect(
      screen.getByText("A first-person stroll across the late Republic."),
    ).toBeInTheDocument();
  });

  it("renders a human-readable narrator chip", () => {
    render(<ReaderStoryCard story={BASE} href="/stories" />);
    expect(screen.getByText("First person")).toBeInTheDocument();
  });

  it("omits the narrator chip when narratorType is null", () => {
    render(
      <ReaderStoryCard
        story={{ ...BASE, narratorType: null }}
        href="/stories"
      />,
    );
    expect(screen.queryByText("First person")).not.toBeInTheDocument();
  });

  it("maps each narrator type to its label", () => {
    const { rerender } = render(
      <ReaderStoryCard
        story={{ ...BASE, narratorType: "third_person" }}
        href="/stories"
      />,
    );
    expect(screen.getByText("Third person")).toBeInTheDocument();
    rerender(
      <ReaderStoryCard
        story={{ ...BASE, narratorType: "omniscient" }}
        href="/stories"
      />,
    );
    expect(screen.getByText("Omniscient")).toBeInTheDocument();
  });
});
