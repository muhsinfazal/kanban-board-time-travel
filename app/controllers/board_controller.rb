class BoardController < ApplicationController
  def show
    render inertia: "Board", props: {
      columns: Card::COLUMNS,
      board: Card.board_state,
      events: recent_events,
      timeline: timeline_meta
    }
  end

  def activity
    render json: { events: recent_events }
  end

  private

  def timeline_meta
    first = Event.minimum(:occurred_at)
    last = Event.maximum(:occurred_at)

    { first_event_at: first, last_event_at: last }
  end

  def recent_events
    Event.recent.map(&:as_event_json)
  end
end
