import React, { useMemo, useState } from "react";
import { generateTripPlan } from "../api/aiTripPlannerApi";
import "../styles/TripPlanner.css";

const CATEGORY_ICONS = {
  Hotel: "🏨",
  "Tour Guide": "🧭",
  Restaurant: "🍽️",
  Experience: "🎯",
  Driver: "🚗",
};

const SUGGESTION_CHIPS = [
  "A relaxing beach holiday in the south coast",
  "Cultural triangle tour — Sigiriya, Kandy, Anuradhapura",
  "Hill country train journey through tea plantations",
  "Wildlife safari and nature exploration",
  "A foodie tour across Colombo and Galle",
];

export default function TripPlanner({ onOpenService }) {
  const [userQuery, setUserQuery] = useState("");
  const [numDays, setNumDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [itinerary, setItinerary] = useState([]);

  const hasResults = useMemo(
    () => Array.isArray(itinerary) && itinerary.length > 0,
    [itinerary]
  );

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
      if (!Array.isArray(data) || data.length === 0) {
        setError("Trip planner returned an empty itinerary. Try a different description.");
      }
    } catch (e) {
      let msg = "Trip planner request failed. Please try again.";
      if (e?.response?.data) {
        const bd = e.response.data;
        msg = typeof bd === "string" ? bd : bd?.message || JSON.stringify(bd);
      } else if (e?.message) {
        msg = e.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (text) => {
    setUserQuery(text);
  };

  return (
    <div className="trip-planner">
      {/* Header */}
      <div className="tp-header">
        <div className="tp-header-icon">✈️</div>
        <div>
          <h3 className="tp-title">AI Trip Planner</h3>
          <p className="tp-subtitle">
            Describe your dream Sri Lanka trip and get a personalized day-by-day itinerary
          </p>
        </div>
      </div>

      {/* Suggestion chips */}
      {!hasResults && !loading && (
        <div className="tp-chips">
          <span className="tp-chips-label">Try:</span>
          {SUGGESTION_CHIPS.map((chip, i) => (
            <button
              key={i}
              type="button"
              className="tp-chip"
              onClick={() => handleChipClick(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="tp-input-area">
        <div className="tp-textarea-wrapper">
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="E.g., I want a 5-day cultural tour covering Kandy, Sigiriya, and Galle with hotel stays and local food experiences..."
            rows={3}
            className="tp-textarea"
            disabled={loading}
          />
        </div>

        <div className="tp-controls">
          <div className="tp-days-control">
            <label className="tp-days-label">Days</label>
            <div className="tp-days-stepper">
              <button
                type="button"
                className="tp-stepper-btn"
                onClick={() => setNumDays((d) => Math.max(1, d - 1))}
                disabled={numDays <= 1 || loading}
              >
                −
              </button>
              <span className="tp-days-value">{numDays}</span>
              <button
                type="button"
                className="tp-stepper-btn"
                onClick={() => setNumDays((d) => Math.min(14, d + 1))}
                disabled={numDays >= 14 || loading}
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !userQuery.trim()}
            className="tp-generate-btn"
          >
            {loading ? (
              <>
                <span className="tp-spinner" />
                Generating...
              </>
            ) : (
              <>🗺️ Generate Itinerary</>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="tp-error">
          <span className="tp-error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="tp-loading">
          <div className="tp-loading-animation">
            <div className="tp-plane">✈️</div>
            <div className="tp-loading-text">
              Planning your perfect trip...
              <br />
              <span className="tp-loading-sub">This may take a few seconds</span>
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="tp-skeleton-day">
              <div className="tp-skeleton-bar tp-skeleton-title" />
              <div className="tp-skeleton-bar tp-skeleton-activity" />
              <div className="tp-skeleton-bar tp-skeleton-activity short" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {hasResults && !loading && (
        <div className="tp-results">
          <div className="tp-results-header">
            <h4 className="tp-results-title">
              🗓️ Your {itinerary.length}-Day Itinerary
            </h4>
            <button
              type="button"
              className="tp-regenerate-btn"
              onClick={handleGenerate}
            >
              🔄 Regenerate
            </button>
          </div>

          {itinerary.map((dayPlan, idx) => {
            const dayNumber = dayPlan?.day ?? idx + 1;
            const dayTitle = dayPlan?.title || `Day ${dayNumber}`;
            const activities = Array.isArray(dayPlan?.activities)
              ? dayPlan.activities
              : [];

            return (
              <div key={dayNumber} className="tp-day-card">
                <div className="tp-day-header">
                  <div className="tp-day-badge">Day {dayNumber}</div>
                  <div className="tp-day-title">{dayTitle}</div>
                </div>

                {activities.length === 0 ? (
                  <div className="tp-no-activities">No activities planned</div>
                ) : (
                  <div className="tp-activities">
                    {activities.map((act, aIdx) => {
                      const time = act?.time || "";
                      const serviceId = act?.serviceId || "";
                      const serviceName = act?.serviceName || "";
                      const note = act?.note || "";
                      const category = act?.category || "";
                      const icon = CATEGORY_ICONS[category] || "📍";

                      return (
                        <div key={`${dayNumber}-${aIdx}`} className="tp-activity">
                          <div className="tp-activity-time">
                            <span className="tp-time-dot" />
                            <span>{time}</span>
                          </div>
                          <div className="tp-activity-content">
                            <div className="tp-activity-top">
                              <span className="tp-activity-icon">{icon}</span>
                              {category && (
                                <span className="tp-activity-category">{category}</span>
                              )}
                            </div>
                            {note && <div className="tp-activity-note">{note}</div>}
                            {serviceId && (
                              <button
                                type="button"
                                className="tp-service-link"
                                onClick={() => onOpenService?.(serviceId)}
                              >
                                📋 {serviceName || "View Service"} →
                              </button>
                            )}
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
      )}
    </div>
  );
}
