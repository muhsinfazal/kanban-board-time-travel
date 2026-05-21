Rails.application.routes.draw do
  resources :cards, only: %i[create update destroy] do
    member do
      patch :move
    end
  end

  root 'board#show'
end
