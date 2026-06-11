import { SearchResultsView } from "@/components/search/search-results-view";

interface PageProps {
  params: Promise<{ searchId: string }>;
}

export default async function SearchResultsPage({ params }: PageProps) {
  const { searchId } = await params;

  return <SearchResultsView searchId={searchId} />;
}
