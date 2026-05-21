import React, { useState, useRef } from "react";
import { ClockIcon } from "../Icon";

export default function TimelineBar({
  timeline,
  isHistorical,
  historicalTime,
  onScrub,
  onReturn
}) {
  const [sliderValue, setSliderValue] = useState(100);
  const debounceRef = useRef(null);
  const hasEvents = timeline?.first_event_at != null;

  const handleChange = (e) => {
    const val = Number(e.target.value);
    setSliderValue(val);

    if (val === 100) {
      onReturn();
      return;
    }

    if (!hasEvents) return;

    const start = new Date(timeline.first_event_at).getTime();
    const end = Date.now();
    const ts = new Date(start + ((end - start) * val) / 100);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onScrub(ts.toISOString());
    }, 120);
  };

  const handleReturn = () => {
    setSliderValue(100);
    onReturn();
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div
      className={`shrink-0 border-t transition-colors duration-300
      ${
        isHistorical
          ? "border-amber-500/40 bg-amber-950/20"
          : "border-zinc-800 bg-zinc-900/60"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <ClockIcon
            className={`w-4 h-4 ${isHistorical ? "text-amber-400" : "text-zinc-500"}`}
          />
          <span
            className={`text-xs font-medium tracking-wide ${isHistorical ? "text-amber-400" : "text-zinc-500"}`}
          >
            {isHistorical ? "TIME TRAVEL" : "TIMELINE"}
          </span>
        </div>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          {hasEvents && (
            <span className="text-xs text-zinc-600 font-mono shrink-0">
              {formatTime(timeline.first_event_at)}
            </span>
          )}
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={sliderValue}
            onChange={handleChange}
            disabled={!hasEvents}
            className={`flex-1 h-1.5 rounded-full cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed
              ${isHistorical ? "accent-amber-400" : "accent-zinc-400"}`}
          />
          <span className="text-xs text-zinc-500 font-mono shrink-0">
            Now
          </span>
        </div>

        {isHistorical && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2.5 py-1 rounded-md">
              {formatTime(historicalTime)}
            </span>
            <button
              onClick={handleReturn}
              className="text-xs font-medium text-amber-400 hover:text-amber-200 border border-amber-700/50 hover:border-amber-500 px-3 py-1 rounded-md transition-colors"
            >
              Return to live
            </button>
          </div>
        )}
        {!isHistorical && !hasEvents && (
          <span className="text-xs text-zinc-600 shrink-0">
            No events yet
          </span>
        )}
      </div>
    </div>
  );
}
