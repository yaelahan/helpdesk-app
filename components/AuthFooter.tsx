/** Ft2 inline-rule single line: one hairline-topped line, no columns. */
export function AuthFooter() {
  return (
    <footer className="border-t border-rule px-6 py-5 sm:px-10">
      <p className="mono-label text-muted">
        © {new Date().getFullYear()} HelpdeskApp
      </p>
    </footer>
  );
}
