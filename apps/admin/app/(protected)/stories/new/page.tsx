import { StoryFormClient } from "../_components/story-form-client";

export const metadata = {
  title: "New story",
};

export default function NewStoryPage() {
  return <StoryFormClient mode="create" />;
}
