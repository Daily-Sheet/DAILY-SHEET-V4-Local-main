export type AchievementCategory =
  | "shows"
  | "hours"
  | "travel"
  | "checkins"
  | "night_owl"
  | "community"
  | "jobs"
  | "projects"
  | "special";

export type AchievementDef = {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  secret: boolean;
  metricKey: string;
  threshold: number;
};

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  // ── Show Milestones (12) ──
  { key: "first_show", name: "First Show", description: "Work your first show", icon: "🎤", category: "shows", secret: false, metricKey: "shows_worked", threshold: 1 },
  { key: "shows_10", name: "Getting Started", description: "Work 10 shows", icon: "🎵", category: "shows", secret: false, metricKey: "shows_worked", threshold: 10 },
  { key: "shows_25", name: "Quarter Century", description: "Work 25 shows", icon: "🎸", category: "shows", secret: false, metricKey: "shows_worked", threshold: 25 },
  { key: "shows_50", name: "Half Century", description: "Work 50 shows", icon: "🎹", category: "shows", secret: false, metricKey: "shows_worked", threshold: 50 },
  { key: "shows_100", name: "Centurion", description: "Work 100 shows", icon: "💯", category: "shows", secret: false, metricKey: "shows_worked", threshold: 100 },
  { key: "shows_250", name: "Veteran", description: "Work 250 shows", icon: "⭐", category: "shows", secret: false, metricKey: "shows_worked", threshold: 250 },
  { key: "shows_500", name: "Legend", description: "Work 500 shows", icon: "🏆", category: "shows", secret: true, metricKey: "shows_worked", threshold: 500 },
  { key: "shows_1000", name: "Hall of Fame", description: "Work 1,000 shows", icon: "👑", category: "shows", secret: true, metricKey: "shows_worked", threshold: 1000 },
  { key: "shows_2000", name: "Living Legend", description: "Work 2,000 shows — you ARE the industry", icon: "🐐", category: "shows", secret: true, metricKey: "shows_worked", threshold: 2000 },
  { key: "shows_5_week", name: "Five-Show Week", description: "Work 5 shows in a single week", icon: "🏃", category: "shows", secret: false, metricKey: "max_shows_in_week", threshold: 5 },
  { key: "shows_same_day_2", name: "Double Header", description: "Work 2 shows in one day", icon: "🔁", category: "shows", secret: false, metricKey: "max_shows_in_day", threshold: 2 },
  { key: "shows_same_day_3", name: "Triple Threat", description: "Work 3 shows in one day", icon: "⚡", category: "shows", secret: true, metricKey: "max_shows_in_day", threshold: 3 },

  // ── Hours Logged (9) ──
  { key: "hours_100", name: "Punching In", description: "Log 100 hours", icon: "⏱️", category: "hours", secret: false, metricKey: "hours_logged", threshold: 100 },
  { key: "hours_500", name: "Hard Worker", description: "Log 500 hours", icon: "💪", category: "hours", secret: false, metricKey: "hours_logged", threshold: 500 },
  { key: "hours_1000", name: "Iron Will", description: "Log 1,000 hours", icon: "🔨", category: "hours", secret: false, metricKey: "hours_logged", threshold: 1000 },
  { key: "hours_2500", name: "Grinder", description: "Log 2,500 hours", icon: "⚙️", category: "hours", secret: false, metricKey: "hours_logged", threshold: 2500 },
  { key: "hours_5000", name: "Unstoppable", description: "Log 5,000 hours", icon: "🔥", category: "hours", secret: true, metricKey: "hours_logged", threshold: 5000 },
  { key: "hours_10000", name: "10K Club", description: "Log 10,000 hours — mastery achieved", icon: "💎", category: "hours", secret: true, metricKey: "hours_logged", threshold: 10000 },
  { key: "hours_16_day", name: "Marathon Day", description: "Log 16+ hours in a single day", icon: "😤", category: "hours", secret: false, metricKey: "max_hours_single_day", threshold: 16 },
  { key: "hours_20_day", name: "All-Dayer", description: "Log 20+ hours in a single day — sleep is for the weak", icon: "☠️", category: "hours", secret: true, metricKey: "max_hours_single_day", threshold: 20 },
  { key: "hours_60_week", name: "Overtime King", description: "Log 60+ hours in a single week", icon: "🫠", category: "hours", secret: false, metricKey: "max_hours_single_week", threshold: 60 },

  // ── Travel & Geography (12) ──
  { key: "cities_5", name: "Road Trip", description: "Work in 5 different cities", icon: "🚗", category: "travel", secret: false, metricKey: "cities_visited", threshold: 5 },
  { key: "cities_10", name: "Road Warrior", description: "Work in 10 different cities", icon: "🛣️", category: "travel", secret: false, metricKey: "cities_visited", threshold: 10 },
  { key: "cities_25", name: "Globe Trotter", description: "Work in 25 different cities", icon: "✈️", category: "travel", secret: false, metricKey: "cities_visited", threshold: 25 },
  { key: "cities_50", name: "Everywhere Man", description: "Work in 50 different cities", icon: "🌍", category: "travel", secret: true, metricKey: "cities_visited", threshold: 50 },
  { key: "cities_100", name: "World Tour", description: "Work in 100 different cities", icon: "🗺️", category: "travel", secret: true, metricKey: "cities_visited", threshold: 100 },
  { key: "venues_10", name: "Venue Hopper", description: "Work at 10 different venues", icon: "🏟️", category: "travel", secret: false, metricKey: "venues_worked", threshold: 10 },
  { key: "venues_25", name: "House Expert", description: "Work at 25 different venues", icon: "🏛️", category: "travel", secret: false, metricKey: "venues_worked", threshold: 25 },
  { key: "venues_50", name: "Venue Connoisseur", description: "Work at 50 different venues", icon: "🎪", category: "travel", secret: true, metricKey: "venues_worked", threshold: 50 },
  { key: "venues_100", name: "Venue Encyclopedia", description: "Work at 100 different venues — you've seen them all", icon: "📚", category: "travel", secret: true, metricKey: "venues_worked", threshold: 100 },
  { key: "states_10", name: "Coast to Coast", description: "Work in 10 different states", icon: "🇺🇸", category: "travel", secret: false, metricKey: "states_visited", threshold: 10 },
  { key: "states_25", name: "National Act", description: "Work in 25 different states", icon: "🦅", category: "travel", secret: false, metricKey: "states_visited", threshold: 25 },
  { key: "states_50", name: "All 50", description: "Work in all 50 states", icon: "🏅", category: "travel", secret: true, metricKey: "states_visited", threshold: 50 },

  // ── Check-ins & Consistency (11) ──
  { key: "checkins_first", name: "Clocked In", description: "Complete your first check-in", icon: "✅", category: "checkins", secret: false, metricKey: "checkins", threshold: 1 },
  { key: "checkins_50", name: "Reliable", description: "Check in 50 times", icon: "📋", category: "checkins", secret: false, metricKey: "checkins", threshold: 50 },
  { key: "checkins_200", name: "Like Clockwork", description: "Check in 200 times", icon: "⏰", category: "checkins", secret: false, metricKey: "checkins", threshold: 200 },
  { key: "checkins_500", name: "The Machine", description: "Check in 500 times", icon: "🤖", category: "checkins", secret: true, metricKey: "checkins", threshold: 500 },
  { key: "streak_7", name: "Full Week", description: "Work 7 consecutive days", icon: "📅", category: "checkins", secret: false, metricKey: "longest_streak", threshold: 7 },
  { key: "streak_14", name: "Two Weeks Strong", description: "Work 14 consecutive days", icon: "💪", category: "checkins", secret: false, metricKey: "longest_streak", threshold: 14 },
  { key: "streak_30", name: "Iron Month", description: "Work 30 consecutive days", icon: "🗓️", category: "checkins", secret: true, metricKey: "longest_streak", threshold: 30 },
  { key: "streak_60", name: "Tour Mode", description: "Work 60 consecutive days — true road dog", icon: "🐕", category: "checkins", secret: true, metricKey: "longest_streak", threshold: 60 },
  { key: "streak_90", name: "Unbreakable", description: "Work 90 consecutive days", icon: "🔗", category: "checkins", secret: true, metricKey: "longest_streak", threshold: 90 },
  { key: "early_bird", name: "Early Bird", description: "Check in before 6 AM 10 times", icon: "🌅", category: "checkins", secret: false, metricKey: "early_checkins", threshold: 10 },
  { key: "early_bird_50", name: "Dawn Patrol", description: "Check in before 6 AM 50 times", icon: "🐓", category: "checkins", secret: true, metricKey: "early_checkins", threshold: 50 },

  // ── Night Owl & Time-Based (10) ──
  { key: "night_owl", name: "Night Owl", description: "Complete 10 schedule items after midnight", icon: "🦉", category: "night_owl", secret: false, metricKey: "after_midnight_completions", threshold: 10 },
  { key: "night_owl_50", name: "Vampire", description: "Complete 50 items after midnight", icon: "🧛", category: "night_owl", secret: true, metricKey: "after_midnight_completions", threshold: 50 },
  { key: "night_owl_200", name: "Creature of the Night", description: "Complete 200 items after midnight", icon: "🌑", category: "night_owl", secret: true, metricKey: "after_midnight_completions", threshold: 200 },
  { key: "weekend_warrior", name: "Weekend Warrior", description: "Work 20 weekend shows", icon: "🎉", category: "night_owl", secret: false, metricKey: "weekend_shows", threshold: 20 },
  { key: "weekend_warrior_100", name: "No Days Off", description: "Work 100 weekend shows", icon: "🫡", category: "night_owl", secret: true, metricKey: "weekend_shows", threshold: 100 },
  { key: "holiday_hero", name: "Holiday Hero", description: "Work on a major holiday", icon: "🎄", category: "night_owl", secret: true, metricKey: "holiday_shows", threshold: 1 },
  { key: "holiday_hero_5", name: "Holiday Regular", description: "Work 5 major holidays — your family misses you", icon: "🎅", category: "night_owl", secret: true, metricKey: "holiday_shows", threshold: 5 },
  { key: "sunday_load_in", name: "Sunday Funday", description: "Work 10 Sunday load-ins", icon: "📦", category: "night_owl", secret: false, metricKey: "sunday_shows", threshold: 10 },
  { key: "back_to_back_late", name: "Red Eye", description: "Work two midnight+ finishes in a row", icon: "👁️", category: "night_owl", secret: true, metricKey: "back_to_back_late_nights", threshold: 2 },
  { key: "sunrise_club", name: "Sunrise Club", description: "Still working at 5 AM", icon: "🌄", category: "night_owl", secret: true, metricKey: "past_5am_completions", threshold: 1 },

  // ── Community & Social (10) ──
  { key: "first_map_pin", name: "Trailblazer", description: "Add your first community map pin", icon: "📍", category: "community", secret: false, metricKey: "map_pins_created", threshold: 1 },
  { key: "map_pins_10", name: "Local Guide", description: "Add 10 map pins", icon: "🗺️", category: "community", secret: false, metricKey: "map_pins_created", threshold: 10 },
  { key: "map_pins_25", name: "Cartographer", description: "Add 25 map pins", icon: "🧭", category: "community", secret: false, metricKey: "map_pins_created", threshold: 25 },
  { key: "vendor_review_first", name: "Critic", description: "Leave your first vendor review", icon: "📝", category: "community", secret: false, metricKey: "vendor_reviews", threshold: 1 },
  { key: "vendor_reviews_10", name: "Trusted Reviewer", description: "Leave 10 vendor reviews", icon: "🏅", category: "community", secret: false, metricKey: "vendor_reviews", threshold: 10 },
  { key: "vendor_reviews_25", name: "Industry Insider", description: "Leave 25 vendor reviews — people listen to you", icon: "🎖️", category: "community", secret: true, metricKey: "vendor_reviews", threshold: 25 },
  { key: "workspaces_3", name: "Team Player", description: "Be a member of 3 workspaces", icon: "🤝", category: "community", secret: false, metricKey: "workspaces_joined", threshold: 3 },
  { key: "workspaces_5", name: "Connected", description: "Be a member of 5 workspaces", icon: "🌐", category: "community", secret: true, metricKey: "workspaces_joined", threshold: 5 },
  { key: "workspaces_10", name: "The Networker", description: "Be a member of 10 workspaces — you know everyone", icon: "🕸️", category: "community", secret: true, metricKey: "workspaces_joined", threshold: 10 },
  { key: "vendor_import", name: "Good Taste", description: "Import a vendor from the community directory", icon: "👆", category: "community", secret: false, metricKey: "vendors_imported", threshold: 1 },

  // ── Job Board (9) ──
  { key: "first_application", name: "Putting Myself Out There", description: "Apply to your first job", icon: "📨", category: "jobs", secret: false, metricKey: "jobs_applied", threshold: 1 },
  { key: "first_gig_booked", name: "First Gig Booked", description: "Get approved for your first job", icon: "🎯", category: "jobs", secret: false, metricKey: "jobs_booked", threshold: 1 },
  { key: "jobs_applied_10", name: "Hustler", description: "Apply to 10 jobs", icon: "📬", category: "jobs", secret: false, metricKey: "jobs_applied", threshold: 10 },
  { key: "jobs_applied_50", name: "Persistent", description: "Apply to 50 jobs — the grind doesn't stop", icon: "📮", category: "jobs", secret: true, metricKey: "jobs_applied", threshold: 50 },
  { key: "jobs_booked_5", name: "In Demand", description: "Get booked on 5 jobs", icon: "🔥", category: "jobs", secret: false, metricKey: "jobs_booked", threshold: 5 },
  { key: "jobs_booked_25", name: "Hot Commodity", description: "Get booked on 25 jobs", icon: "💰", category: "jobs", secret: true, metricKey: "jobs_booked", threshold: 25 },
  { key: "jobs_booked_50", name: "First Call", description: "Get booked on 50 jobs — you're everyone's first call", icon: "📱", category: "jobs", secret: true, metricKey: "jobs_booked", threshold: 50 },
  { key: "first_job_posted", name: "The Boss", description: "Post your first job listing", icon: "📢", category: "jobs", secret: false, metricKey: "jobs_posted", threshold: 1 },
  { key: "jobs_posted_10", name: "Crew Chief", description: "Post 10 job listings", icon: "📣", category: "jobs", secret: false, metricKey: "jobs_posted", threshold: 10 },

  // ── Projects & Reports (9) ──
  { key: "projects_5", name: "Multi-Tasker", description: "Work on 5 different projects", icon: "📂", category: "projects", secret: false, metricKey: "projects_worked", threshold: 5 },
  { key: "projects_10", name: "Portfolio Builder", description: "Work on 10 different projects", icon: "📁", category: "projects", secret: false, metricKey: "projects_worked", threshold: 10 },
  { key: "projects_25", name: "Production Veteran", description: "Work on 25 different projects", icon: "🎬", category: "projects", secret: false, metricKey: "projects_worked", threshold: 25 },
  { key: "roles_5", name: "Versatile", description: "Hold 5 different positions across shows", icon: "🎭", category: "projects", secret: false, metricKey: "unique_roles", threshold: 5 },
  { key: "roles_10", name: "Swiss Army Knife", description: "Hold 10 different positions — is there anything you can't do?", icon: "🔧", category: "projects", secret: false, metricKey: "unique_roles", threshold: 10 },
  { key: "roles_20", name: "Renaissance Crew", description: "Hold 20 different positions", icon: "🎨", category: "projects", secret: true, metricKey: "unique_roles", threshold: 20 },
  { key: "after_job_report", name: "Documenter", description: "Submit your first after-job report", icon: "📄", category: "projects", secret: false, metricKey: "reports_submitted", threshold: 1 },
  { key: "after_job_reports_10", name: "Thorough", description: "Submit 10 after-job reports", icon: "📑", category: "projects", secret: false, metricKey: "reports_submitted", threshold: 10 },
  { key: "after_job_reports_25", name: "Quality Control", description: "Submit 25 after-job reports — management loves you", icon: "✨", category: "projects", secret: false, metricKey: "reports_submitted", threshold: 25 },

  // ── Special / Hidden / Industry (23) ──
  { key: "wrapped_first", name: "It's a Wrap", description: "View your first Annual Wrapped", icon: "🎬", category: "special", secret: true, metricKey: "wrapped_viewed", threshold: 1 },
  { key: "new_years_show", name: "Auld Lang Syne", description: "Work a show on New Year's Eve", icon: "🎆", category: "special", secret: true, metricKey: "new_years_shows", threshold: 1 },
  { key: "friday_13th", name: "Fearless", description: "Work a show on Friday the 13th", icon: "🖤", category: "special", secret: true, metricKey: "friday_13th_shows", threshold: 1 },
  { key: "same_venue_10", name: "Resident", description: "Work at the same venue 10 times", icon: "🏠", category: "special", secret: true, metricKey: "max_same_venue", threshold: 10 },
  { key: "same_venue_25", name: "House Tech", description: "Work at the same venue 25 times", icon: "🔑", category: "special", secret: true, metricKey: "max_same_venue", threshold: 25 },
  { key: "same_venue_50", name: "You Live Here Now", description: "Work at the same venue 50 times — do you even go home?", icon: "🛏️", category: "special", secret: true, metricKey: "max_same_venue", threshold: 50 },
  { key: "july_4th", name: "Fireworks Tech", description: "Work a show on July 4th", icon: "🎇", category: "special", secret: true, metricKey: "july_4th_shows", threshold: 1 },
  { key: "halloween_show", name: "Spooky Season", description: "Work a show on Halloween", icon: "🎃", category: "special", secret: true, metricKey: "halloween_shows", threshold: 1 },
  { key: "super_bowl_sunday", name: "Game Day", description: "Work a show on Super Bowl Sunday", icon: "🏈", category: "special", secret: true, metricKey: "super_bowl_shows", threshold: 1 },
  { key: "valentines_show", name: "No Valentine", description: "Work a show on Valentine's Day", icon: "💔", category: "special", secret: true, metricKey: "valentines_shows", threshold: 1 },
  { key: "tour_complete", name: "Tour Wrap", description: "Complete all dates on a tour", icon: "🚌", category: "special", secret: false, metricKey: "tours_completed", threshold: 1 },
  { key: "tour_complete_5", name: "Tour Veteran", description: "Complete 5 full tours", icon: "🚐", category: "special", secret: true, metricKey: "tours_completed", threshold: 5 },
  { key: "festival_survivor", name: "Festival Survivor", description: "Work a 3+ day festival", icon: "🏕️", category: "special", secret: false, metricKey: "festivals_worked", threshold: 1 },
  { key: "festival_5", name: "Festival Circuit", description: "Work 5 festivals", icon: "⛺", category: "special", secret: false, metricKey: "festivals_worked", threshold: 5 },
  { key: "load_in_load_out", name: "Full Circle", description: "Work both load-in and load-out on the same show", icon: "🔄", category: "special", secret: false, metricKey: "full_circle_shows", threshold: 1 },
  { key: "five_star_report", name: "Flawless Execution", description: "Submit an after-job report with a 5-star rating", icon: "⭐", category: "special", secret: false, metricKey: "five_star_reports", threshold: 1 },
  { key: "five_star_10", name: "Perfectionist", description: "Submit 10 after-job reports with 5-star ratings", icon: "🌟", category: "special", secret: true, metricKey: "five_star_reports", threshold: 10 },
  { key: "rain_show", name: "Rain or Shine", description: "Work an outdoor show in the rain", icon: "🌧️", category: "special", secret: true, metricKey: "rain_shows", threshold: 1 },
  { key: "multi_workspace_week", name: "Free Agent", description: "Work for 3 different workspaces in one week", icon: "🤹", category: "special", secret: true, metricKey: "max_workspaces_in_week", threshold: 3 },
  { key: "thousand_mile_week", name: "Road Dog", description: "Travel 1,000+ miles between shows in a single week", icon: "🛞", category: "special", secret: true, metricKey: "max_miles_in_week", threshold: 1000 },
  { key: "mentor", name: "Mentor", description: "Be the first to welcome 5 new workspace members", icon: "🧑‍🏫", category: "special", secret: true, metricKey: "members_welcomed", threshold: 5 },
  { key: "night_before_xmas", name: "Night Before Christmas", description: "Work a show on December 24th", icon: "🎁", category: "special", secret: true, metricKey: "xmas_eve_shows", threshold: 1 },
  { key: "leap_day", name: "Once Every Four Years", description: "Work a show on February 29th", icon: "🦘", category: "special", secret: true, metricKey: "leap_day_shows", threshold: 1 },
];

export const ACHIEVEMENT_BY_KEY = new Map(ACHIEVEMENT_CATALOG.map(a => [a.key, a]));

export const ACHIEVEMENT_CATEGORIES: { key: AchievementCategory; label: string }[] = [
  { key: "shows", label: "Show Milestones" },
  { key: "hours", label: "Hours Logged" },
  { key: "travel", label: "Travel & Geography" },
  { key: "checkins", label: "Check-ins & Consistency" },
  { key: "night_owl", label: "Night Owl & Time" },
  { key: "community", label: "Community & Social" },
  { key: "jobs", label: "Job Board" },
  { key: "projects", label: "Projects & Reports" },
  { key: "special", label: "Special" },
];

/** All unique metric keys used across achievements */
export const ALL_METRIC_KEYS = Array.from(new Set(ACHIEVEMENT_CATALOG.map(a => a.metricKey)));
