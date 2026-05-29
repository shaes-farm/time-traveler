import { PlaceholderPage } from "../../../../../components/placeholder-page";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;

  return (
    <PlaceholderPage
      title={`Edit event: ${slug}`}
      description="Event editor surface scaffolded for dashboard deep-link flows."
      trackedIn="a later batch (TBD)"
      rows={3}
    />
  );
}
