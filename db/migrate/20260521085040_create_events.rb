class CreateEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :events do |t|
      t.string :event_type, null: false
      t.bigint :card_id, null: false
      t.jsonb :payload, null: false, default: {}
      t.datetime :occurred_at, null: false
    end

    add_index :events, :occurred_at
    add_index :events, :card_id
    add_index :events, :event_type
  end
end
