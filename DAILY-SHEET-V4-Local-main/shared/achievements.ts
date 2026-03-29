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
  // ── Show Milestones ──
  { key: "first_show", name: "First Show", description: "Work your first show", icon: "🎤", category: "shows", secret: false, metricKey: "shows_worked", threshold: 1 },
  { key: "shows_10", name: "Getting Started", description: "Work 10 shows", icon: "🎵", category: "shows", secret: false, metricKey: "shows_worked", threshold: 10 },
  { key: "shows_25", name: "Quarter Century", description: "Work 25 shows", icon: "🎸", category: "shows", secret: false, metricKey: "shows_worked", threshold: 25 },
  { key: "shows_50", name: "Half Century", description: "Work 50 shows", icon: "🎹", category: "shows", secret: false, metricKey: "shows_worked", threshold: 50 },
  { key: "shows_100", name: "Centurion", description: "Work 100 shows", icon: "💯", category: "shows", secret: false, metricKey: "shows_worked", threshold: 100 },
  { key: "shows_250", name: "Veteran", description: "Work 250 shows", icon: "⭐", category: "shows", secret: false, metricKey: "shows_worked", threshold: 250 },
  { key: "shows_500", name: "Legend", description: "Work 500 shows", icon: "🏆", category: "shows", secret: true, metricKey: "shows_worked", threshold: 500 },
  { key: "shows_1000", name: "Hall of Fame", description: "Work 1,000 shows", icon: "👑", category: "shows", secret: true, metricKey: "shows_worked", threshold: 1000 },

  // ── Hours Logged ──
  { key: "hours_100", name: "Punching In", description: "Log 100 hours", icon: "⏱️", category: "hours", secret: false, metricKey: "hours_logged", threshold: 100 },
  { key: "hours_500", name: "Hard Worker", description: "Log 500 hours", icon: "💪", category: "hours", secret: false, metricKey: "hours_logged", threshold: 500 },
  { key: "hours_1000", name: "Iron Will", description: "Log 1,000 hours", icon: "🔨", category: "hours", secret: false, metricKey: "hours_logged", threshold: 1000 },
  { key: "hours_5000", name: "Unstoppable", description: "Log 5,000 hours", icon: "🔥", category: "hours", secret: true, metricKey: "hours_logged", threshold: 5000 },
  { key: "hours_10000", name: "10K Club", description: "Log 10,000 hours", icon: "💎", category: "hours", secret: true, metricKey: "hours_logged", threshold: 10000 },

  // ── Travel & Geography ──
  { key: "cities_5", name: "Road Trip", description: "Work in 5 different cities", icon: "🚗", category: "travel", secret: false, metricKey: "cities_visited", threshold: 5 },
  { key: "cities_10", name: "Road Warrior", description: "Work in 10 different cities", icon: "🛣️", category: "travel", secret: false, metricKey: "cities_visited", threshold: 10 },
  { key: "cities_25", name: "Globe Trotter", description: "Work in 25 different cities", icon: "✈️", category: "travel", secret: false, metricKey: "cities_visited", threshold: 25 },
  { key: "cities_50", name: "Everywhere Man", description: "Work in 50 different cities", icon: "🌍", category: "travel", secret: true, metricKey: "cities_visited", threshold: 50 },
  { key: "venues_10", name: "Venue Hopper", description: "Work at 10 different venues", icon: "🏟️", category: "travel", secret: false, metricKey: "venues_worked", threshold: 10 },
  { key: "venues_25", name: "House Expert", description: "Work at 25 different venues", icon: "🏛️", category: "travel", secret: false, metricKey: "venues_worked", threshold: 25 },
  { key: "venues_50", name: "Venue Connoisseur", description: "Work at 50 different venues", icon: "🎪", category: "travel", secret: true, metricKey: "venues_worked", threshold: 50 },

  // ── Check-ins & Consistency ──
  { key: "checkins_first", name: "Clocked In", description: "Complete your first check-in", icon: "✅", category: "checkins", secret: false, metricKey: "checkins", threshold: 1 },
  { key: "checkins_50", name: "Reliable", description: "Check in 50 times", icon: "📋", category: "checkins", secret: false, metricKey: "checkins", threshold: 50 },
  { key: "checkins_200", name: "Like Clockwork", description: "Check in 200 times", icon: "⏰", category: "checkins", secret: false, metricKey: "checkins", threshold: 200 },
  { key: "streak_7", name: "Full Week", description: "Work 7 consecutive days", icon: "📅", category: "checkins", secret: false, metricKey: "longest_streak", threshold: 7 },
  { key: "streak_14", name: "Two Weeks Strong", description: "Work 14 consecutive days", icon: "💪", category: "checkins", secret: false, metricKey: "longest_streak", threshold: 14 },
  { key: "streak_30", name: "Iron Month", description: "Work 30 consecutive days", icon: "🗓️", category: "checkins", secret: true, metricKey: "longest_streak", threshold: 30 },
  { key: "early_bird", name: "Early Bird", description: "Check in before 6 AM 10 times", icon: "🌅", category: "checkins", secret: false, metricKey: "early_checkins", threshold: 10 },

  // ── Night Owl & Time-Based ──
  { key: "night_owl", name: "Night Owl", description: "Complete 10 schedule items after midnight", icon: "🦉", category: "night_owl", secret: false, metricKey: "after_midnight_completions", threshold: 10 },
  { key: "night_owl_50", name: "Vampire", description: "Complete 50 items after midnight", icon: "🧛", category: "night_owl", secret: true, metricKey: "after_midnight_completions", threshold: 50 },
  { key: "weekend_warrior", name: "Weekend Warrior", description: "Work 20 weekend shows", icon: "🎉", category: "night_owl", secret: false, metricKey: "weekend_shows", threshold: 20 },
  { key: "holiday_hero", name: "Holiday Hero", description: "Work on a major holiday", icon: "🎄", category: "night_owl", secret: true, metricKey: "holiday_shows", threshold: 1 },

  // ── Community & Social ──
  { key: "first_map_pin", name: "Trailblazer", description: "Add your first community map pin", icon: "📍", category: "community", secret: false, metricKey: "map_pins_created", threshold: 1 },
  { key: "map_pins_10", name: "Local Guide", description: "Add 10 map pins", icon: "🗺️", category: "community", secret: false, metricKey: "map_pins_created", threshold: 10 },
  { key: "vendor_review_first", name: "Critic", description: "Leave your first vendor review", icon: "📝", category: "community", secret: false, metricKey: "vendor_reviews", threshold: 1 },
  { key: "vendor_reviews_10", name: "Trusted Reviewer", description: "Leave 10 vendor reviews", icon: "🏅", category: "community", secret: false, metricKey: "vendor_reviews", threshold: 10 },
  { key: "workspaces_3", name: "Team Player", description: "Be a member of 3 workspaces", icon: "🤝", category: "community", secret: false, metricKey: "workspaces_joined", threshold: 3 },
  { key: "workspaces_5", name: "Connected", description: "Be a member of 5 workspaces", icon: "🌐", category: "community", secret: true, metricKey: "workspaces_joined", threshold: 5 },

  // ── Job Board ──
  { key: "first_application", name: "Putting Myself Out There", description: "Apply to your first job", icon: "📨", category: "jobs", secret: false, metricKey: "jobs_applied", threshold: 1 },
  { key: "first_gig_booked", name: "First Gig Booked", description: "Get approved for your first job", icon: "🎯", category: "jobs", secret: false, metricKey: "jobs_booked", threshold: 1 },
  { key: "jobs_applied_10", name: "Hustler", description: "Apply to 10 jobs", icon: "📬", category: "jobs", secret: false, metricKey: "jobs_applied", threshold: 10 },
  { key: "jobs_booked_5", name: "In Demand", description: "Get booked on 5 jobs", icon: "🔥", category: "jobs", secret: false, metricKey: "jobs_booked", threshold: 5 },
  { key: "jobs_booked_25", name: "Hot Commodity", description: "Get booked on 25 jobs", icon: "💰", category: "jobs", secret: true, metricKey: "jobs_booked", threshold: 25 },
  { key: "first_job_posted", name: "The Boss", description: "Post your first job listing", icon: "📢", category: "jobs", secret: false, metricKey: "jobs_posted", threshold: 1 },

  // ── Projects & Reports ──
  { key: "projects_5", name: "Multi-Tasker", description: "Work on 5 different projects", icon: "📂", category: "projects", secret: false, metricKey: "projects_worked", threshold: 5 },
  { key: "projects_10", name: "Portfolio Builder", description: "Work on 10 different projects", icon: "📁", category: "projects", secret: false, metricKey: "projects_worked", threshold: 10 },
  { key: "roles_5", name: "Versatile", description: "Hold 5 different positions across shows", icon: "🎭", category: "projects", secret: false, metricKey: "unique_roles", threshold: 5 },
  { key: "after_job_report", name: "Documenter", description: "Submit your first after-job report", icon: "📄", category: "projects", secret: false, metricKey: "reports_submitted", threshold: 1 },
  { key: "after_job_reports_10", name: "Thorough", description: "Submit 10 after-job reports", icon: "📑", category: "projects", secret: false, metricKey: "reports_submitted", threshold: 10 },

  // ── Special / Hidden ──
  { key: "wrapped_first", name: "It's a Wrap", description: "View your first Annual Wrapped", icon: "🎬", category: "special", secret: true, metricKey: "wrapped_viewed", threshold: 1 },
  { key: "new_years_show", name: "Auld Lang Syne", description: "Work a show on New Year's Eve", icon: "🎆", category: "special", secret: true, metricKey: "new_years_shows", threshold: 1 },
  { key: "friday_13th", name: "Fearless", description: "Work a show on Friday the 13th", icon: "🖤", category: "special", secret: true, metricKey: "friday_13th_shows", threshold: 1 },
  { key: "same_venue_10", name: "Resident", description: "Work at the same venue 10 times", icon: "🏠", category: "special", secret: true, metricKey: "max_same_venue", threshold: 10 },
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
