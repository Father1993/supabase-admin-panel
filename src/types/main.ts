export type PaginationProps = {
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (p: number) => void;
    remainingToConfirm?: number;
  };

  export type ProductImageProps = {
    productId: string | number;
    productName?: string | null;
    className?: string;
  };
  
  export type ImageData = {
    url: string;
    width: number;
    height: number;
    type: string;
  };