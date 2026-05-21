# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_05_21_120000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "cards", force: :cascade do |t|
    t.string "column_name", default: "backlog", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.decimal "position", precision: 15, scale: 10, default: "0.0", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["column_name", "position"], name: "index_cards_on_column_name_and_position"
  end

  create_table "events", force: :cascade do |t|
    t.bigint "card_id", null: false
    t.string "event_type", null: false
    t.datetime "occurred_at", null: false
    t.jsonb "payload", default: {}, null: false
    t.index ["card_id"], name: "index_events_on_card_id"
    t.index ["event_type"], name: "index_events_on_event_type"
    t.index ["occurred_at", "id"], name: "index_events_on_occurred_at_and_id"
    t.index ["occurred_at"], name: "index_events_on_occurred_at"
  end
end
