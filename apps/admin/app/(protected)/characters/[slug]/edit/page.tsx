import { PlaceholderPage } from "../../../../../components/placeholder-page";

interface CharacterDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CharacterDetailPage({
  params,
}: CharacterDetailPageProps) {
  const { slug } = await params;

  return (
    <PlaceholderPage
      title={`Edit character: ${slug}`}
      description="Character editor surface scaffolded for dashboard deep-link flows."
      trackedIn="a later batch (TBD)"
      rows={3}
    />
  );
}
