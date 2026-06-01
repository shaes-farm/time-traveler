import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar, CornerDownRight, GitBranch } from "lucide-react";

import { Tree, type TreeNode } from "./tree";

const meta = {
  title: "Components/Tree",
  component: Tree,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tree>;
export default meta;

type Story = StoryObj<typeof meta>;

// Fractal timeline hierarchy: timeline → events → (event expands into)
// sub-timeline → events. The drill-down nodes mirror events with a
// `detail_timeline_id` (#177).
const FRACTAL: TreeNode[] = [
  {
    id: "tl-cosmic",
    label: "Cosmic history",
    icon: GitBranch,
    meta: "BYA",
    defaultExpanded: true,
    children: [
      {
        id: "ev-bigbang",
        label: "The Big Bang",
        icon: Calendar,
        meta: "13.8 BYA",
      },
      {
        id: "ev-curie-life",
        label: "Marie Curie's life",
        icon: Calendar,
        meta: "⤵",
        children: [
          {
            id: "tl-curie",
            label: "Curie scientific biography",
            icon: CornerDownRight,
            meta: "CE",
            defaultExpanded: true,
            children: [
              {
                id: "ev-paris",
                label: "Arrives in Paris",
                icon: Calendar,
                meta: "1891 CE",
              },
              {
                id: "ev-polonium",
                label: "Discovery of polonium",
                icon: Calendar,
                meta: "1898 CE",
              },
              {
                id: "ev-nobel",
                label: "Nobel Prize in Physics",
                icon: Calendar,
                meta: "1903 CE",
              },
            ],
          },
        ],
      },
    ],
  },
];

export const FractalHierarchy: Story = {
  args: {
    "aria-label": "Fractal timeline hierarchy",
    nodes: FRACTAL,
    className: "max-w-sm",
  },
};

export const FlatLeaves: Story = {
  args: {
    "aria-label": "Categories",
    nodes: [
      { id: "science", label: "Science", meta: "12" },
      { id: "art", label: "Art", meta: "5" },
      { id: "politics", label: "Politics", meta: "8" },
    ],
    className: "max-w-sm",
  },
};
