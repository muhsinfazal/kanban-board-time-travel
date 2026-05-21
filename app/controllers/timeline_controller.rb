class TimelineController < ApplicationController
  def show
    timestamp = Time.zone.parse(params[:at])
    board = Event.board_at(timestamp)
    events = Event.before_or_at(timestamp).recent.map(&:as_event_json)

    render json: { board:, events:, timestamp: }
  rescue ArgumentError, TypeError
    render json: { error: "Invalid timestamp" }, status: :unprocessable_entity
  end

  def events
    events = Event.order(:occurred_at, :id).pluck(:occurred_at, :id).map do |timestamp, id|
      { id:, occurred_at: timestamp }
    end

    render json: { events: }
  end
end
