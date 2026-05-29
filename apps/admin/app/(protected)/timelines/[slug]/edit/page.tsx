import { PlaceholderPage } from "../../../../../components/placeholder-page";

interface TimelineDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TimelineDetailPage({
  params,
}: TimelineDetailPageProps) {
  const { slug } = await params;

  return (
    <PlaceholderPage
      title={`Edit timeline: ${slug}`}
      description="Timeline editor surface scaffolded for dashboard deep-link flows."
      trackedIn="a later batch (TBD)"
      rows={3}
    />
  );
}
