export type PaginationProps = {
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (p: number) => void;
    remainingToConfirm?: number;
  };

  export type ProductImageProps = {
    imageUrl?: string | null;
    productName?: string | null;
    className?: string;
  };