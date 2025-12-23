export interface ReviewResponseDto {
  id: string;
  storeId: string;
  productId?: string | null;
  rating: number;
  criteriaRatings: Record<string, number> | null;
  comment: string | null;
  tags: { key: string; label: string }[];
  username: string | null;
  createdAt: string;
  canDelete: boolean;
}

export interface ReviewSummaryDto {
  storeId?: string | null;
  productId?: string | null;
  averageRating: number;
  total: number;
  counts: Record<number, number>;
  topTags: { key: string; label: string; count: number }[];
}
