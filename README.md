# Kanban Board with Time-Travel

A single-board Kanban application built with Ruby on Rails, React, Inertia.js, and Tailwind CSS. Every change to the board is recorded as an immutable event, enabling full reconstruction of board state at any past moment via a timeline slider.

Repository: https://github.com/muhsinfazal/kanban-board-time-travel.git

---

## Setup

### Requirements (tested)

| Tool       | Recommended / Tested version |
|------------|-----------------------------:|
| Ruby       | 3.4.7                        |
| Node.js    | 22.13.1                      |
| PostgreSQL | 14.19                        |
| Bundler    | 2.6.9                        |

Notes: The app uses Rails 8.1.3 and modern JS (Vite + React 19). Newer Ruby / Node releases are usually compatible; use the tested versions above for fastest setup.

### Quick start (from a clean clone)

These are the only developer steps required after cloning.

```bash
git clone https://github.com/muhsinfazal/kanban-board-time-travel.git
cd kanban-board-time-travel
bin/setup
bin/dev
```

`bin/setup` will install gems & JS deps, create and migrate the database, and seed sample data. `bin/dev` starts the Rails app and the Vite dev server together (watching the frontend assets).

Open http://localhost:3100 (the default dev port used by this project).

---

## Architecture Overview

This section explains how current board state and history are stored, and how the application reconstructs the board at an arbitrary past timestamp.

Card state (current)

- The `cards` table contains the current projection of the board. Each row holds `id`, `title`, `description`, `column_name`, and a high-precision `position` decimal used to order cards within a column.
- Reordering uses fractional positions: when moving a card between neighbors we compute a midpoint between their `position` values and update only the moved card. This keeps reorders O(1) on the write path.

Event storage (immutable history)

- All mutating actions append to the `events` table: `(id, event_type, card_id, payload JSONB, occurred_at)`.
- `payload` contains either the full post-change card state or a `changes` object capturing before/after values. Each event type is self-describing (e.g., `card_created`, `card_updated`, `card_moved`, `card_reordered`, `card_deleted`).
- Events are append-only and never updated, supplying an auditable, deterministic timeline.


Historical reconstruction (time travel)

- The app uses periodic snapshots to bound replay cost. A `BoardSnapshot` model captures the board state every N events (default: `SNAPSHOT_EVERY = 100`). When reconstructing the board at time `T` the implementation first looks for the nearest snapshot at or before `T` and, if found, loads its stored `state` and replays only the delta events between the snapshot time and `T`. If no snapshot exists (early history) it falls back to a full replay of events up to `T`.

```ruby
snapshot = BoardSnapshot.nearest_before(timestamp)
if snapshot
	# Start from snapshot and replay the delta
	cards = snapshot.state.transform_keys(&:to_i)
	delta = Event.where('occurred_at > ? AND occurred_at <= ?', snapshot.snapshotted_at, timestamp).order(:occurred_at, :id)
	apply_events(cards, delta)
else
	# Full replay
	cards = {}
	apply_events(cards, Event.where('occurred_at <= ?', timestamp).order(:occurred_at, :id))
end
# group by column and sort by position for the final projection
```

- `BoardSnapshot.maybe_snapshot!` is invoked when events are recorded and will create a new snapshot every `SNAPSHOT_EVERY` events (100). This means normal time-travel reconstruction is bounded to replaying at most one snapshot window (≈100 events) plus any post-snapshot delta, greatly improving performance compared to unbounded full replay.

Design rationale

- Simplicity and correctness: replaying a deterministic append-only log in Ruby is straightforward to reason about and test. It guarantees that the reconstructed state matches the exact sequence of operations that produced it.
- Low operational complexity: writes are simple appends (cheap), and the current projection (`cards` table) is maintained eagerly so normal reads are fast.
- Alternatives considered: periodic snapshots, an actively-maintained projection table for historical moments, or pushing more work into SQL (CTEs). Each introduces complexity (consistency, snapshot timing, extra background jobs). For small-to-moderate histories, replay is simpler and sufficient.

Indexing

- The app includes an index on `occurred_at` and `card_id`. A composite index on `(:occurred_at, :id)` is also added to support efficient ordering for keyset pagination and chronological scans.

---

## Scaling Discussion (100,000 historical events)

How the current design behaves

- Querying: `WHERE occurred_at <= ? ORDER BY occurred_at, id` can make use of the `occurred_at, id` index so locating the relevant portion of the log is O(log N).
- Replay cost: reconstructing the board requires iterating over all qualifying events. Replaying 100k events in Ruby is linear in the number of events and may take on the order of 1–2 seconds depending on hardware; acceptable for occasional timeline scrubs but not for millisecond-scale interactivity.
- Activity log: the UI uses keyset-style fetching (`limit` with cursor) so the recent-activity view remains cheap regardless of total history.

Production changes to handle large history

1. Periodic snapshots (recommended):
	- Persist a complete board snapshot every N events (for example, every 1,000).
	- To reconstruct at T, load the most recent snapshot at or before T and replay the delta events after the snapshot up to T. This bounds the replay window to ≤ N events.
	- Snapshot creation can be offloaded to a background worker so writes remain fast.

2. Incremental or rolling snapshots:
	- Instead of full snapshots, store incremental checkpoints per column or per-card deltas for finer-grained recovery.

3. Dedicated projection table / materialized view for historical points:
	- Maintain materialized projections for commonly-requested timestamps (e.g., daily snapshots) if customers need frequent historical queries.

4. Storage & partitioning:
	- Partition the `events` table by time (monthly/quarterly) to improve vacuuming and archive old partitions.

5. Read scaling:
	- Route heavy historical queries to read replicas to avoid affecting the primary writer instance.

6. Auxiliary optimizations:
	- Use a lower-level reconstruction in SQL (CTE) or a compiled native worker if replay becomes CPU-bound.
	- Cache snapshots in Redis or a CDN for extremely hot historical points.
