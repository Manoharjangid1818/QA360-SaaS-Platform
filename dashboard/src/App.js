import { useState } from "react";

function isValidTestUrl(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successPayload, setSuccessPayload] = useState(null);

  const runTest = async () => {
    setErrorText("");
    setSuccessPayload(null);

    const apiBase = process.env.REACT_APP_API_URL;
    if (!apiBase || !apiBase.trim()) {
      setErrorText("Missing REACT_APP_API_URL. Set it in .env for local dev or in Vercel.");
      return;
    }

    if (!isValidTestUrl(url)) {
      setErrorText("Please enter a valid http or https URL.");
      return;
    }

    const trimmedUrl = url.trim();
    setLoading(true);

    try {
      const res = await fetch(`${apiBase.replace(/\/$/, "")}/run-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status !== "success") {
        setErrorText(
          typeof data.message === "string"
            ? data.message
            : `Request failed (${res.status}).`
        );
        return;
      }

      setSuccessPayload({
        message: data.message,
        testedUrl: data.testedUrl ?? trimmedUrl,
        time: data.time ?? "—",
      });
    } catch {
      setErrorText("Could not reach the backend. Check the API URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "64px",
        fontFamily: "system-ui, Arial, sans-serif",
        maxWidth: "520px",
        marginLeft: "auto",
        marginRight: "auto",
        padding: "0 16px",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>QA360 Website Testing Tool 🚀</h1>
      <p style={{ color: "#555", marginBottom: "24px" }}>
        Enter any website URL to test
      </p>

      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ padding: "10px", width: "100%", maxWidth: "400px", boxSizing: "border-box" }}
        disabled={loading}
      />

      <div style={{ marginTop: "16px" }}>
        <button type="button" onClick={runTest} disabled={loading}>
          {loading ? "Running..." : "Run Test"}
        </button>
      </div>

      {errorText ? (
        <p style={{ color: "#b00020", marginTop: "24px" }} role="alert">
          {errorText}
        </p>
      ) : null}

      {successPayload ? (
        <div
          style={{
            marginTop: "24px",
            textAlign: "left",
            background: "#f5f5f5",
            borderRadius: "8px",
            padding: "16px 20px",
            lineHeight: 1.6,
          }}
        >
          <div>
            <strong>Status:</strong> success
          </div>
          <div>
            <strong>Message:</strong> {successPayload.message}
          </div>
          <div>
            <strong>URL:</strong> {successPayload.testedUrl}
          </div>
          <div>
            <strong>Time:</strong> {successPayload.time}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
