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
      setErrorText("Missing REACT_APP_API_URL. Set it in .env or Vercel.");
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
          data.error || data.message || `Request failed (${res.status})`
        );
        return;
      }

      setSuccessPayload({
        message: data.message,
        testedUrl: data.testedUrl ?? trimmedUrl,
        time: data.time ?? "—",
        output: data.output || "",
      });

    } catch {
      setErrorText("❌ Could not reach backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "64px",
        fontFamily: "system-ui, Arial",
        maxWidth: "600px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <h1>QA360 Website Testing Tool 🚀</h1>
      <p>Enter any website URL to test</p>

      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ padding: "10px", width: "100%" }}
        disabled={loading}
      />

      <br /><br />

      <button onClick={runTest} disabled={loading}>
        {loading ? "Running..." : "Run Test"}
      </button>

      {errorText && (
        <p style={{ color: "red", marginTop: "20px" }}>{errorText}</p>
      )}

      {successPayload && (
        <div
          style={{
            marginTop: "20px",
            textAlign: "left",
            background: "#f5f5f5",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <p><strong>Status:</strong> success</p>
          <p><strong>Message:</strong> {successPayload.message}</p>
          <p><strong>URL:</strong> {successPayload.testedUrl}</p>
          <p><strong>Time:</strong> {successPayload.time}</p>

          {successPayload.output && (
            <>
              <p><strong>Logs:</strong></p>
              <pre
                style={{
                  background: "#000",
                  color: "#0f0",
                  padding: "10px",
                  overflowX: "auto",
                  maxHeight: "200px"
                }}
              >
                {successPayload.output}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;