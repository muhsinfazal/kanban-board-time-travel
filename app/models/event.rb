class Event < ApplicationRecord
  EVENT_TYPES = %w[card_created card_updated card_moved card_reordered card_deleted].freeze

  validates :event_type, inclusion: { in: EVENT_TYPES }
  validates :card_id, presence: true

  def self.record!(event_type:, card_id:, payload: {})
    create!(
      event_type:,
      card_id:,
      payload:,
      occurred_at: Time.current
    )
  end
end
