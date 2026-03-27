-- Migration: Replace eventName foreign keys with eventId integer foreign keys
-- This allows events to have duplicate names since relationships now use IDs.

-- 1. Add eventId columns to all affected tables
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS event_id INTEGER;
ALTER TABLE event_assignments ADD COLUMN IF NOT EXISTS event_id INTEGER;
ALTER TABLE files ADD COLUMN IF NOT EXISTS event_id INTEGER;
ALTER TABLE file_folders ADD COLUMN IF NOT EXISTS event_id INTEGER;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS event_id INTEGER;
ALTER TABLE band_portal_links ADD COLUMN IF NOT EXISTS event_id INTEGER;
ALTER TABLE access_links ADD COLUMN IF NOT EXISTS event_id INTEGER;

-- 2. Populate eventId from existing eventName by joining with events table
UPDATE schedules s
SET event_id = e.id
FROM events e
WHERE s.event_name = e.name
  AND s.workspace_id = e.workspace_id
  AND s.event_id IS NULL;

UPDATE event_assignments ea
SET event_id = e.id
FROM events e
WHERE ea.event_name = e.name
  AND ea.workspace_id = e.workspace_id
  AND ea.event_id IS NULL;

UPDATE files f
SET event_id = e.id
FROM events e
WHERE f.event_name = e.name
  AND f.workspace_id = e.workspace_id
  AND f.event_id IS NULL;

UPDATE file_folders ff
SET event_id = e.id
FROM events e
WHERE ff.event_name = e.name
  AND ff.workspace_id = e.workspace_id
  AND ff.event_id IS NULL;

UPDATE daily_checkins dc
SET event_id = e.id
FROM events e
WHERE dc.event_name = e.name
  AND dc.workspace_id = e.workspace_id
  AND dc.event_id IS NULL;

UPDATE band_portal_links bpl
SET event_id = e.id
FROM events e
WHERE bpl.event_name = e.name
  AND bpl.workspace_id = e.workspace_id
  AND bpl.event_id IS NULL;

UPDATE access_links al
SET event_id = e.id
FROM events e
WHERE al.event_name = e.name
  AND al.workspace_id = e.workspace_id
  AND al.event_id IS NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedules_event_id ON schedules(event_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_event_id ON event_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_files_event_id ON files(event_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_event_id ON file_folders(event_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_event_id ON daily_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_band_portal_links_event_id ON band_portal_links(event_id);
CREATE INDEX IF NOT EXISTS idx_access_links_event_id ON access_links(event_id);
