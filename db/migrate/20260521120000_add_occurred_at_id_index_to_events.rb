class AddOccurredAtIdIndexToEvents < ActiveRecord::Migration[8.1]
  def change
    add_index :events, [:occurred_at, :id], name: "index_events_on_occurred_at_and_id"
  end
end
