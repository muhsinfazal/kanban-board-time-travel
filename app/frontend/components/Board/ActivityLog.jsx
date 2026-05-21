import React from "react";

const EVENT_ICONS = {
  card_created: { icon: "✦", color: "text-emerald-400" },
  card_updated: { icon: "✎", color: "text-blue-400" },
  card_moved: { icon: "→", color: "text-amber-400" },
  card_reordered: { icon: "⇅", color: "text-violet-400" },
  card_deleted: { icon: "✕", color: "text-red-400" }
};

export default function ActivityLog({
  events,
  onLoadMore,
  hasMore,
  loadingMore
}) {
  const formatRelative = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  const handleScroll = (event) => {
    if (!onLoadMore || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 120) {
      onLoadMore();
    }
  };

  return (
    <div className="w-72 shrink-0 border-l border-zinc-800 flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
          Activity
        </h2>
      </div>
      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        onScroll={handleScroll}
      >
        {events.length === 0 ? (
          <div className="p-4 text-xs text-zinc-600 text-center mt-4">
            No activity yet
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {events.map((e) => {
              const { icon, color } = EVENT_ICONS[e.event_type] || {
                icon: "·",
                color: "text-zinc-500"
              };
              return (
                <div
                  key={e.id}
                  className="px-4 py-3 hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex gap-2.5">
                    <span
                      className={`text-xs mt-0.5 shrink-0 font-mono ${color}`}
                    >
                      {icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-300 leading-snug">
                        {e.description}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1 font-mono">
                        {formatRelative(e.occurred_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <div className="px-4 py-3 text-xs text-zinc-500 text-center">
                {loadingMore ? (
                  "Loading older activity…"
                ) : (
                  <button
                    type="button"
                    onClick={onLoadMore}
                    className="font-medium text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Load older activity
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
