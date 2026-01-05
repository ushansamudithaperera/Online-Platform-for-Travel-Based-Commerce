import React, { useMemo, useState } from "react";
import { generateTripPlan } from "../api/aiTripPlannerApi";

export default function TripPlanner({ onOpenService }) {
  const [userQuery, setUserQuery] = useState("");
  const [numDays, setNumDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [itinerary, setItinerary] = useState([]);

  const hasResults = useMemo(() => Array.isArray(itinerary) && itinerary.length > 0, [itinerary]);

  const handleGenerate = async () => {
    const trimmed = String(userQuery || "").trim();
    if (!trimmed) {
      setError("Please describe your dream trip.");
      return;
    }

    setError("");
    setLoading(true);
    setItinerary([]);

    try {
      const res = await generateTripPlan({ userQuery: trimmed, numDays });
      const data = res?.data;
      setItinerary(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) {
        setError("Trip planner returned an unexpected response.");
      }
    } catch (e) {
      const msg = e?.response?.data || e?.message || "Trip planner request failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 8 }}>AI Trip Planner</h3>
      <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85 }}>
        Describe your dream trip and get a day-by-day itinerary.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ flex: "1 1 520px" }}>
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Describe your dream trip..."
            rows={4}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #d6e4ff" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
          <label style={{ fontWeight: 700 }}>Days</label>
          <input
            type="number"
            min={1}
            max={14}
            value={numDays}
            onChange={(e) => setNumDays(Number(e.target.value || 3))}
            style={{ padding: 8, borderRadius: 10, border: "1px solid #d6e4ff" }}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d6e4ff",
              background: "#f0f4ff",
              color: "#003580",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ padding: 10, borderRadius: 10, border: "1px solid #ffd6d6", background: "#fff5f5" }}>
          {error}
        </div>
      ) : null}

      {hasResults ? (
        <div style={{ marginTop: 16 }}>
          {itinerary.map((dayPlan, idx) => {
            const dayNumber = dayPlan?.day ?? idx + 1;
            const activities = Array.isArray(dayPlan?.activities) ? dayPlan.activities : [];

            return (
              <div key={dayNumber} style={{ marginBottom: 14, padding: 12, borderRadius: 12, border: "1px solid #d6e4ff" }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Day {dayNumber}</div>
                {activities.length === 0 ? (
                  <div style={{ opacity: 0.75 }}>No activities</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activities.map((act, aIdx) => {
                      const time = act?.time || "";
                      const serviceId = act?.serviceId || "";
                      const note = act?.note || "";

                      return (
                        <div
                          key={`${dayNumber}-${aIdx}`}
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #e6efff",
                            background: "#ffffff",
                          }}
                        >
                          <div style={{ minWidth: 60, fontWeight: 900 }}>{time}</div>
                          <div style={{ flex: 1 }}>
                            {note ? <div style={{ fontWeight: 700, marginBottom: 4 }}>{note}</div> : null}
                            {serviceId ? (
                              <button
                                type="button"
                                onClick={() => onOpenService?.(serviceId)}
                                style={{
                                  padding: 0,
                                  border: "none",
                                  background: "transparent",
                                  color: "#003580",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                              >
                                Open service: {serviceId}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
