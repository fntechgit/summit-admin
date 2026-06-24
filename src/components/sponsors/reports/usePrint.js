import { useCallback } from "react";

// Prints the currently loaded report body only (server-paginated page).
// v1 caveat: captures only the currently loaded page, not the full filtered view.
// A true full-report print would need a print-mode fetch of all pages — out of scope.
const usePrint = () => useCallback(() => window.print(), []);

export default usePrint;
