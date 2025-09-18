import { Row } from "./products";

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

export interface RejectButtonProps {
    row: Row
    onReject: (row: Row) => Promise<void>
}

export interface ProductHeaderProps {
    product: Row
    size?: 'large' | 'medium'
    additionalBadges?: React.ReactNode[]
}

export interface ProductSearchProps {
    onSelectProduct: (product: Row | null) => void
    selectedProduct: Row | null
    searchProducts: (query: string) => Promise<Row[]>
}