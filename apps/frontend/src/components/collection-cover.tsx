import { resolveFilePath } from "@/services/file";

interface CollectionCoverProps {
  cover?: string;
  alt: string;
  className: string;
  fallback: React.ReactNode;
}

// The persisted value is always an object path. This component is the single
// rendering boundary that turns it into a public image URL.
export function CollectionCover({
  cover,
  alt,
  className,
  fallback,
}: CollectionCoverProps) {
  if (!cover) return fallback;
  return <img src={resolveFilePath(cover)} alt={alt} className={className} />;
}
