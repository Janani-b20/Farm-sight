import { useState } from "react";

export default function DiseaseCard({ crop = "tomato", location = "" }) {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeDisease(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/disease/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, symptoms, location }),
      });
      if (!response.ok) throw new Error("Disease analysis failed");
      setResult(await response.json());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="disease-heading">
      <h2 id="disease-heading">Disease scout</h2>
      <form onSubmit={analyzeDisease}>
        <label htmlFor="symptoms">Describe what you see</label>
        <textarea
          id="symptoms"
          value={symptoms}
          onChange={(event) => setSymptoms(event.target.value)}
          placeholder="For example: yellow spots on older leaves"
          required
          rows={4}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Analyze symptoms"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {result && (
        <div aria-live="polite">
          <h3>{result.diagnosis}</h3>
          <p>Confidence: {result.confidence}</p>
          <p>{result.recommendation}</p>
          {result.sources?.length > 0 && <small>Sources: {result.sources.join(", ")}</small>}
        </div>
      )}
    </section>
  );
}import React from "react";

const riskColors = {
  low: "#2f855a",
  moderate: "#b7791f",
  high: "#c53030",
};

export default function DiseaseCard({ disease }) {
  if (!disease) return null;

  const level = disease.risk?.toLowerCase() || "low";

  return (
    <article className="disease-card" aria-labelledby="disease-card-title">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Disease watch</p>
          <h2 id="disease-card-title">{disease.name || "No active risk"}</h2>
        </div>
        <span
          className="risk-badge"
          style={{ color: riskColors[level] || riskColors.low }}
          aria-label={`Risk level: ${level}`}
        >
          {level}
        </span>
      </div>
      {disease.reason && <p>{disease.reason}</p>}
      {disease.recommendation && (
        <p className="recommendation">{disease.recommendation}</p>
      )}
      {disease.sources?.length > 0 && (
        <ul className="source-list">
          {disease.sources.map((source) => (
            <li key={source.url || source.title}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}