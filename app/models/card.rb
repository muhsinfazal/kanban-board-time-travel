class Card < ApplicationRecord
  COLUMNS = %w[backlog todo in_progress in_review done].freeze

  validates :title, presence: true
  validates :column_name, inclusion: { in: COLUMNS }

  before_create :set_position
  after_create :record_created_event
  after_update :record_updated_events
  after_destroy :record_deleted_event

  scope :ordered, -> { order(:position) }

  def as_card_json
    {
      id:,
      title:,
      description:,
      column_name:,
      position: position.to_f,
      created_at:
    }
  end

  private

  def set_position
    max = Card.where(column_name:).maximum(:position) || 0
    self.position = max + 1000
  end

  def record_created_event
    Event.record!(
      event_type: "card_created",
      card_id: id,
      payload: {
        title:,
        description:,
        column_name:,
        position: position.to_f
      }
    )
  end

  def record_updated_events
    changes_to_record = {}
    changes_to_record[:title] = [title_before_last_save, title] if saved_change_to_title?
    changes_to_record[:description] = [description_before_last_save, description] if saved_change_to_description?

    if saved_change_to_column_name?
      changes_to_record[:column_name] = [column_name_before_last_save, column_name]
      event_type = "card_moved"
    elsif saved_change_to_position?
      changes_to_record[:position] = [position_before_last_save.to_f, position.to_f]
      event_type = "card_reordered"
    elsif changes_to_record.any?
      event_type = "card_updated"
    else
      return
    end

    Event.record!(
      event_type: event_type || "card_updated",
      card_id: id,
      payload: {
        title:,
        description:,
        column_name:,
        position: position.to_f,
        changes: changes_to_record
      }
    )
  end

  def record_deleted_event
    Event.record!(
      event_type: "card_deleted",
      card_id: id,
      payload: {
        title:,
        description:,
        column_name:,
        position: position.to_f
      }
    )
  end
end
