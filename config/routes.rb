Rails.application.routes.draw do
  resources :cards, only: %i[create update destroy] do
    member do
      patch :move
    end
  end

  get  'timeline', to: 'timeline#show'
  get  'timeline/events', to: 'timeline#events_list'

  get 'activity', to: 'board#activity'

  root 'board#show'
end
