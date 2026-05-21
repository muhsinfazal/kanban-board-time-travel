class CreateCards < ActiveRecord::Migration[8.1]
  def change
    create_table :cards do |t|
      t.string :title, null: false
      t.text :description
      t.string :column_name, null: false, default: "backlog"
      t.decimal :position, precision: 15, scale: 10, null: false, default: 0

      t.timestamps
    end

    add_index :cards, %i[column_name position]
  end
end
