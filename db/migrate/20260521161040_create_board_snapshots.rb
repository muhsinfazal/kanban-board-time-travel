class CreateBoardSnapshots < ActiveRecord::Migration[8.1]
  def change
    create_table :board_snapshots do |t|
      t.jsonb :state, null: false, default: {}
      t.bigint :last_event_id, null: false
      t.datetime :snapshotted_at, null: false
    end
 
    add_index :board_snapshots, :snapshotted_at
    add_index :board_snapshots, :last_event_id
  end
end
