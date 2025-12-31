// src/App.jsx
import { useEffect, useState } from "react";

const API_BASE = "https://ml-fastapi-backend-g1bx.onrender.com";

// Change these to match your real 7 feature names and descriptions
const FEATURE_DEFS = [
  { name: "age", label: "Age (years)", type: "number" },
  { name: "balance", label: "Account balance", type: "number" },
  { name: "duration", label: "Call duration (seconds)", type: "number" },
  {
    name: "campaign",
    label: "Number of contacts in this campaign",
    type: "number",
  },
  { name: "previous", label: "Number of previous contacts", type: "number" },
  { name: "pdays", label: "Days since last contact (pdays)", type: "number" },
  {
    name: "poutcome",
    label: "Previous outcome (0 = failure, 1 = success)",
    type: "number",
  },
];

function App() {
  const [features, setFeatures] = useState(FEATURE_DEFS.map(() => ""));
  const [modelType, setModelType] = useState("decision_tree");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [backendReady, setBackendReady] = useState(false);

  // Optional: ping backend to ensure it is up
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(API_BASE + "/");
        if (!res.ok) {
          setError("Backend / endpoint returned error: " + res.status);
          return;
        }
        const data = await res.json();
        // Optionally, you can compare data.n_features with 7
        if (data.n_features && data.n_features !== FEATURE_DEFS.length) {
          setError(
            `Backend expects ${data.n_features} features, but frontend is configured for ${FEATURE_DEFS.length}.`
          );
          return;
        }
        setBackendReady(true);
      } catch (err) {
        console.error(err);
        setError("Error connecting to backend.");
      }
    };
    checkBackend();
  }, []);

  const handleFeatureChange = (idx, value) => {
    const copy = [...features];
    copy[idx] = value;
    setFeatures(copy);
  };

  const handlePredict = async () => {
    setError("");
    setResult(null);

    if (!backendReady) {
      setError("Backend is not ready yet.");
      return;
    }

    // Validate that all inputs are filled
    for (let i = 0; i < FEATURE_DEFS.length; i++) {
      if (features[i] === "") {
        setError("Please fill all fields before predicting.");
        return;
      }
    }

    const featuresFloats = features.map((v) => parseFloat(v));

    try {
      const res = await fetch(API_BASE + "/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          features: featuresFloats,
          model_type: modelType,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError("Error from backend: " + text);
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Error sending prediction request.");
    }
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "20px auto",
        fontFamily: "Arial, sans-serif",
        color: "white",
      }}
    >
      <h1>Bank Marketing Prediction</h1>

      <div style={{ marginBottom: 10 }}>
        <label>
          Model type:{" "}
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
          >
            <option value="decision_tree">Decision Tree</option>
            <option value="logistic_regression">Logistic Regression</option>
          </select>
        </label>
      </div>

      <h3>Client information</h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginTop: "10px",
        }}
      >
        {FEATURE_DEFS.map((f, i) => (
          <div
            key={f.name}
            style={{ display: "flex", flexDirection: "column", width: 240 }}
          >
            <label style={{ marginBottom: 4 }}>{f.label}</label>
            <input
              type={f.type}
              step="any"
              value={features[i]}
              onChange={(e) => handleFeatureChange(i, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handlePredict}
        style={{ marginTop: 15, padding: "6px 12px", cursor: "pointer" }}
      >
        Predict
      </button>

      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}

      {result && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            border: "1px solid #ccc",
          }}
        >
          <h2>Prediction Result</h2>
          <p>
            <strong>Model:</strong> {result.model}
          </p>
          <p>
            <strong>Prediction:</strong> {result.prediction}
          </p>
          <p>
            <strong>Class 0 probability:</strong>{" "}
            {result.class_0_probability.toFixed(4)}
          </p>
          <p>
            <strong>Class 1 probability:</strong>{" "}
            {result.class_1_probability.toFixed(4)}
          </p>
          <p>
            <strong>Confidence:</strong> {result.confidence.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
