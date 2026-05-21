class CardsController < ApplicationController
  before_action :set_card, only: %i[update destroy]

  def create
    card = Card.new(card_params)

    if card.save
      render json: { card: card.as_card_json }, status: :created
    else
      render json: { errors: card.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @card.update(card_params)
      render json: { card: @card.as_card_json }
    else
      render json: { errors: @card.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @card.destroy
    
    render json: { ok: true }
  end

  def move
    @card = Card.find(params[:id])
    new_column = params[:column_name]
    new_position = compute_position(new_column, params[:before_id], params[:after_id])
    @card.update!(column_name: new_column, position: new_position)

    render json: { card: @card.as_card_json }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: :not_found
  end

  private

  def set_card
    @card = Card.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: :not_found
  end

  def card_params
    params.require(:card).permit(:title, :description, :column_name)
  end

  def compute_position(column, before_id, after_id)
    siblings = Card.where(column_name: column).order(:position)

    before_card = before_id.present? ? siblings.find { |c| c.id.to_s == before_id.to_s } : nil
    after_card  = after_id.present?  ? siblings.find { |c| c.id.to_s == after_id.to_s }  : nil

    if before_card.nil? && after_card.nil?
      (siblings.last&.position || 0).to_f + 1000
    elsif before_card.nil?
      after_card.position.to_f / 2.0
    elsif after_card.nil?
      before_card.position.to_f + 1000
    else
      (before_card.position.to_f + after_card.position.to_f) / 2.0
    end
  end
end
