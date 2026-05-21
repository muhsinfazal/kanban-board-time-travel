# Optional sample data - run with: rails db:seed
puts "Creating sample cards…"

[
  { title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing and deployment.", column_name: "backlog" },
  { title: "Design system tokens", description: "Define color, spacing, and typography tokens.", column_name: "backlog" },
  { title: "Write API documentation", column_name: "todo" },
  { title: "Implement search feature", description: "Full-text search across card titles and descriptions.", column_name: "todo" },
  { title: "Refactor authentication", column_name: "in_progress" },
  { title: "Fix login bug", description: "Users intermittently can't log in on mobile Safari.", column_name: "in_progress" },
  { title: "Code review: payments module", column_name: "in_review" },
  { title: "Update onboarding flow", column_name: "done" },
  { title: "Legacy cleanup", description: "Remove deprecated v1 API endpoints.", column_name: "done" },
].each do |attrs|
  Card.create!(attrs)
end

puts "Done. #{Card.count} cards, #{Event.count} events."
