export interface ReviewResponseDto {
  id: string;
  rating: number;
  comment: string | null;
  tags: { key: string; label: string }[];
  username: string | null;
  createdAt: string;
  canDelete: boolean;
}

export interface ReviewSummaryDto {
  storeId: string;
  averageRating: number;
  total: number;
  counts: Record<number, number>;
  topTags: { key: string; label: string; count: number }[];
}
