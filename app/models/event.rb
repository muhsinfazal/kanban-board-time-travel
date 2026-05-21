class Event < ApplicationRecord
  EVENT_TYPES = %w[card_created card_updated card_moved card_reordered card_deleted].freeze

  validates :event_type, inclusion: { in: EVENT_TYPES }
  validates :card_id, presence: true

  scope :recent, -> { order(occurred_at: :desc, id: :desc).limit(50) }

  def self.record!(event_type:, card_id:, payload: {})
    create!(
      event_type:,
      card_id:,
      payload:,
      occurred_at: Time.current
    )
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
