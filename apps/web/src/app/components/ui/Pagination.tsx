type PaginationProps = {
  page: number;
  pageCount: number;
  pageRangeDisplayed?: number;
  marginPagesDisplayed?: number;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
};

const getPages = (
  page: number,
  pageCount: number,
  pageRangeDisplayed: number,
  marginPagesDisplayed: number,
) => {
  const pages = new Set<number>();
  for (let i = 0; i < Math.min(marginPagesDisplayed, pageCount); i += 1)
    pages.add(i);
  for (
    let i = Math.max(0, pageCount - marginPagesDisplayed);
    i < pageCount;
    i += 1
  )
    pages.add(i);
  const halfRange = Math.floor(pageRangeDisplayed / 2);
  for (
    let i = Math.max(0, page - halfRange);
    i <= Math.min(pageCount - 1, page + halfRange);
    i += 1
  ) {
    pages.add(i);
  }
  return [...pages].sort((a, b) => a - b);
};

const Pagination = ({
  page,
  pageCount,
  pageRangeDisplayed = 3,
  marginPagesDisplayed = 1,
  onPageChange,
  ariaLabel = "Pagination",
}: PaginationProps) => {
  if (pageCount <= 0) return null;

  const pages = getPages(
    page,
    pageCount,
    pageRangeDisplayed,
    marginPagesDisplayed,
  );
  const pagesWithBreaks = pages.map((pageNumber, index) => ({
    pageNumber,
    showBreak: index > 0 && pageNumber - pages[index - 1] > 1,
  }));

  return (
    <ul className="pagination" aria-label={ariaLabel}>
      <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
        <button
          type="button"
          className="page-link"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          {"<"}
        </button>
      </li>
      {pagesWithBreaks.map(({ pageNumber, showBreak }) => (
        <li
          key={pageNumber}
          className={`page-item ${pageNumber === page ? "active" : ""}`}
        >
          {showBreak ? <span className="page-link">...</span> : null}
          <button
            type="button"
            className="page-link"
            aria-current={pageNumber === page ? "page" : undefined}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber + 1}
          </button>
        </li>
      ))}
      <li className={`page-item ${page >= pageCount - 1 ? "disabled" : ""}`}>
        <button
          type="button"
          className="page-link"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
        >
          {">"}
        </button>
      </li>
    </ul>
  );
};

export default Pagination;
