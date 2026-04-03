import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type AuthorsPaginationProps = {
  page: number
  totalPages: number
  visiblePages: Array<number | "ellipsis">
  onPageChange: (page: number) => void
}

export function AuthorsPagination({
  page,
  totalPages,
  visiblePages,
  onPageChange,
}: AuthorsPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <Pagination className="mx-0 w-auto justify-start">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
        {visiblePages.map((visiblePage, index) => (
          <PaginationItem key={`${visiblePage}-${index}`}>
            {visiblePage === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(visiblePage)}
                isActive={page === visiblePage}
                className="cursor-pointer"
              >
                {visiblePage}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
