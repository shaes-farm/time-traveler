import { TimelineFormClient } from "../../_components/timeline-form-client";

interface EditTimelinePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTimelinePage({
  params,
}: EditTimelinePageProps) {
  const { id } = await params;

  // Session is already validated by the (protected) layout; the client hook
  // loads the row by its UUID primary key (deterministic for owners and
  // collaborators alike — #234).
  return <TimelineFormClient mode="edit" id={id} />;
}
