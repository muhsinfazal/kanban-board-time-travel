class BoardController < ApplicationController
  def show
    render inertia: "Board", props: {
      columns: Card::COLUMNS,
      board: Card.board_state,
      events: Event.recent.map(&:as_event_json),
    }
  end
end
