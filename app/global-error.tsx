"use client";

/** Last-resort boundary when the root layout itself fails. Self-contained styles. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-GB">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#1d1d1f" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "120px 24px" }}>
          <p style={{ color: "#6e6e73", fontSize: 14 }}>500</p>
          <h1 style={{ fontSize: 32, lineHeight: "40px", fontWeight: 600, margin: "12px 0 0" }}>The site could not load.</h1>
          <p style={{ color: "#424245", fontSize: 18, lineHeight: "28px" }}>Please try again in a moment. Nothing you entered was sent.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, minHeight: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#1d1d1f", color: "#fff", fontSize: 14, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
