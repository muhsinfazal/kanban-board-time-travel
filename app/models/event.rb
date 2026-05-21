class Event < ApplicationRecord
  EVENT_TYPES = %w[card_created card_updated card_moved card_reordered card_deleted].freeze

  validates :event_type, inclusion: { in: EVENT_TYPES }
  validates :card_id, presence: true

  scope :chronological, -> { order(:occurred_at, :id) }
  scope :before_or_at, ->(time) { where('occurred_at <= ?', time) }
  scope :before_anchor, ->(time, id) {
    where('occurred_at < ? OR (occurred_at = ? AND id < ?)', time, time, id)
  }
  scope :recent, ->(limit = 25) { order(occurred_at: :desc, id: :desc).limit(limit) }

  def self.record!(event_type:, card_id:, payload: {})
    create!(
      event_type:,
      card_id:,
      payload:,
      occurred_at: Time.current
    )
  end

  def self.board_at(timestamp)
    events = before_or_at(timestamp).chronological.to_a
    cards = {}

    events.each do |event|
      cid = event.card_id
      p = event.payload

      case event.event_type
      when "card_created"
        cards[cid] = {
          id: cid,
          title: p["title"],
          description: p["description"],
          column_name: p["column_name"],
          position: p["position"].to_f
        }
      when "card_updated"
        next unless cards[cid]
        changes = p["changes"] || {}
        cards[cid][:title] = changes["title"]&.last || p["title"] || cards[cid][:title]
        cards[cid][:description] = changes["description"]&.last if changes["description"]
        cards[cid][:description] = p["description"] if p["description"] && !changes["description"]
      when "card_moved"
        next unless cards[cid]
        cards[cid][:column_name] = p["column_name"]
        cards[cid][:position] = p["position"].to_f
      when "card_reordered"
        next unless cards[cid]
        cards[cid][:position] = p["position"].to_f
      when "card_deleted"
        cards.delete(cid)
      end
    end

    result = Card::COLUMNS.each_with_object({}) { |col, h| h[col] = [] }
    cards.each_value do |card|
      col = card[:column_name]
      result[col] << card if result.key?(col)
    end
    result.each_value { |col_cards| col_cards.sort_by! { |c| c[:position] } }
    result
  end

  def human_readable
    p = payload
    title = p["title"] || "Untitled"
    case event_type
    when "card_created"
      "Card '#{title}' created in #{column_label(p["column_name"])}"
    when "card_updated"
      changes = p["changes"] || {}
      if changes["title"]
        "Card '#{changes["title"].first}' renamed to '#{changes["title"].last}'"
      elsif changes["description"]
        "Card '#{title}' description updated"
      else
        "Card '#{title}' updated"
      end
    when "card_moved"
      changes = p["changes"] || {}
      from = changes["column_name"]&.first
      to = changes["column_name"]&.last || p["column_name"]
      if from
        "Card '#{title}' moved from #{column_label(from)} to #{column_label(to)}"
      else
        "Card '#{title}' moved to #{column_label(to)}"
      end
    when "card_reordered"
      "Card '#{title}' reordered in #{column_label(p["column_name"])}"
    when "card_deleted"
      "Card '#{title}' deleted"
    else
      "Unknown event"
    end
  end

  def as_event_json
    {
      id: id,
      description: human_readable,
      occurred_at: occurred_at,
      event_type: event_type
    }
  end

  private

  def column_label(col)
    {
      "backlog" => "Backlog",
      "todo" => "To Do",
      "in_progress" => "In Progress",
      "in_review" => "In Review",
      "done" => "Done"
    }[col] || col.to_s.humanize
  end
end
