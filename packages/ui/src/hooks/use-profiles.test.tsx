import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";
import { describe, it, expect, vi } from "vitest";
import {
  useProfileByUsername,
  useProfilesByIds,
  profileKeys,
} from "./use-profiles";

vi.mock("@repo/services/profile-service", () => ({
  getProfileByUsername: vi.fn(),
  getProfilesByIds: vi.fn(),
}));

import {
  getProfileByUsername,
  getProfilesByIds,
} from "@repo/services/profile-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockClient = {} as any;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

const mockProfile = {
  id: "user-1",
  username: "irenejc",
  first_name: "Irène",
  last_name: "Joliot-Curie",
};

describe("useProfileByUsername", () => {
  it("calls getProfileByUsername when username is non-empty", async () => {
    vi.mocked(getProfileByUsername).mockResolvedValue(mockProfile as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useProfileByUsername(mockClient, "irenejc"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getProfileByUsername).toHaveBeenCalledWith(mockClient, "irenejc");
  });

  it("is disabled for an empty username", () => {
    vi.mocked(getProfileByUsername).mockClear();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProfileByUsername(mockClient, ""), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getProfileByUsername).not.toHaveBeenCalled();
  });
});

describe("useProfilesByIds", () => {
  it("calls getProfilesByIds when ids are present", async () => {
    vi.mocked(getProfilesByIds).mockResolvedValue([mockProfile] as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useProfilesByIds(mockClient, ["user-1"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getProfilesByIds).toHaveBeenCalledWith(mockClient, ["user-1"]);
  });

  it("is disabled for an empty id list", () => {
    vi.mocked(getProfilesByIds).mockClear();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useProfilesByIds(mockClient, []), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getProfilesByIds).not.toHaveBeenCalled();
  });
});

describe("profileKeys", () => {
  it("produces stable, unique keys", () => {
    expect(profileKeys.all).toEqual(["profiles"]);
    expect(profileKeys.byUsername("ada")).toEqual([
      "profiles",
      "username",
      "ada",
    ]);
    expect(profileKeys.byIds(["a", "b"])).toEqual([
      "profiles",
      "ids",
      ["a", "b"],
    ]);
  });
});
