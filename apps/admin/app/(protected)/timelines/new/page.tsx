import { TimelineFormClient } from "../_components/timeline-form-client";

export const metadata = {
  title: "New timeline",
};

export default function NewTimelinePage() {
  return <TimelineFormClient mode="create" />;
}
