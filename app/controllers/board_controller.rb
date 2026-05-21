class BoardController < ApplicationController
  def show
    render inertia: "Board", props: {
      columns: Card::COLUMNS,
      board: Card.board_state,
      events: recent_events,
    }
  end

  private

  def recent_events
    Event.recent.map do |e|
      {
        id: e.id,
        description: e.human_readable,
        occurred_at: e.occurred_at,
        event_type: e.event_type
      }
    end
  end
end
