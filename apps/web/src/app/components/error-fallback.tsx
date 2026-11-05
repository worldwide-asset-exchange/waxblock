//import { ErrorBoundary } from "react-error-boundary";

import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  const { pathname } = useLocation();
  const originalPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== originalPathname.current) {
      resetErrorBoundary();
    }
  }, [pathname, resetErrorBoundary]);

  const refreshPage = () => {
    window.location.reload();
  };
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ height: "350px" }}
    >
      <div role="alert">
        <p>Something went wrong:</p>
        <pre>{error.message}</pre>
        <button onClick={refreshPage} className="btn btn-primary">
          Try Refresh
        </button>
      </div>
    </div>
  );
}

export default ErrorFallback;
