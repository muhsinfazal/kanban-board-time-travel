Rails.application.routes.draw do
  resources :cards, only: %i[create update destroy] do
    member do
      patch :move
    end
  end

  resource :timeline, only: :show do
    get :events, on: :collection
  end

  root 'board#show'
end
