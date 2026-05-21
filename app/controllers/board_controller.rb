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
    limit = params.fetch(:limit, 25).to_i.clamp(1, 100)
    events = if params[:before_occurred_at].present? && params[:before_id].present?
      anchor_time = Time.zone.parse(params[:before_occurred_at])
      anchor_id = Integer(params[:before_id])
      Event.before_anchor(anchor_time, anchor_id).recent(limit)
    else
      Event.recent(limit)
    end

    render json: {
      events: events.map(&:as_event_json),
      has_more: events.size == limit && more_events?(events.last)
    }
  rescue ArgumentError, TypeError
    render json: { error: "Invalid pagination cursor" }, status: :unprocessable_entity
  end

  private

  def more_events?(last_event)
    return false unless last_event

    Event.before_anchor(last_event.occurred_at, last_event.id).exists?
  end

  def timeline_meta
    first = Event.minimum(:occurred_at)
    last = Event.maximum(:occurred_at)

    { first_event_at: first, last_event_at: last }
  end

  def recent_events
    Event.recent.map(&:as_event_json)
  end
end
