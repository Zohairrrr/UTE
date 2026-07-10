"use client";

export default function GlobalError() {
  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F9F7F2", color: "#233426", padding: "24px" }}>
          <section style={{ maxWidth: "520px", border: "1px solid rgba(35,52,38,.15)", background: "#F1EDE2", padding: "32px" }}>
            <p style={{ color: "#A07A4B", fontWeight: 700, letterSpacing: ".2em", fontSize: "12px" }}>SERVICE NOTICE</p>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "44px", lineHeight: 1, letterSpacing: ".04em" }}>Something went wrong.</h1>
            <p style={{ lineHeight: 1.7, opacity: .72 }}>Refresh the page or contact URBAN TIFFIN AND EVENTS if the problem continues.</p>
          </section>
        </main>
      </body>
    </html>
  );
}
