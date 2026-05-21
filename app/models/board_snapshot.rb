class BoardSnapshot < ApplicationRecord
  SNAPSHOT_EVERY = 100

  def self.nearest_before(timestamp)
    where("snapshotted_at <= ?", timestamp)
      .order(snapshotted_at: :desc, id: :desc)
      .first
  end

  def self.maybe_snapshot!
    total = Event.count
    return unless total % SNAPSHOT_EVERY == 0

    last_event = Event.order(:occurred_at, :id).last
    return unless last_event
    return if exists?(last_event_id: last_event.id)

    state = Event.replay_all
    create!(
      state: state,
      last_event_id: last_event.id,
      snapshotted_at: last_event.occurred_at
    )
  end
end