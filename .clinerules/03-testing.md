# Testing & Verification Rules

After making changes, always run `npm run build` and report the full output.

For any UI or component work, also run the relevant Playwright tests and include the results.

Keep these considerations in mind on every change:
- Row Level Security (RLS)
- Role-based access (student vs teacher)
- Mobile responsiveness
- Protection for the special admin account

The goal is to deliver clean, safe changes that don’t break existing flows. Solid verification is also how you earn Creative Freedom for the turn.