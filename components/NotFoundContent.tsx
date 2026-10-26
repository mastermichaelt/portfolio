import Link from "next/link";

export function NotFoundContent() {
  return (
    <main id="content">
      <div className="container container-narrow section stack">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>
          That URL is not on this site. Use the navigation above or return to
          the homepage.
        </p>
        <p>
          <Link href="/">Return home</Link>
        </p>
      </div>
    </main>
  );
}
