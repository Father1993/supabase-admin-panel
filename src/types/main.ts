export type PaginationProps = {
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (p: number) => void;
    remainingToConfirm?: number;
  };