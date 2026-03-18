import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;
const pool = new Pool({
  connectionString: "postgresql://event_hub_db_d3xz_user:bRJjJLtsGxh1XD97JcVSul0OFE8Ktg7j@dpg-d6jmr3ngi27c738869dg-a.oregon-postgres.render.com/event_hub_db_d3xz",
  ssl: { rejectUnauthorized: false }
});

const projects = JSON.parse(fs.readFileSync('prod_projects.json'));
const events = JSON.parse(fs.readFileSync('prod_events.json'));
const venues = JSON.parse(fs.readFileSync('prod_venues.json'));
const schedules = JSON.parse(fs.readFileSync('prod_schedules.json'));
const contacts = JSON.parse(fs.readFileSync('prod_contacts.json'));
const assignments = JSON.parse(fs.readFileSync('prod_assignments.json'));

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`DELETE FROM event_assignments WHERE workspace_id = 1`);
    await client.query(`DELETE FROM schedules WHERE workspace_id = 1`);
    await client.query(`DELETE FROM events WHERE workspace_id = 1`);
    await client.query(`DELETE FROM projects WHERE workspace_id = 1`);
    await client.query(`DELETE FROM contacts WHERE workspace_id = 1`);

    for (const v of venues) {
      await client.query(`INSERT INTO venues (id, name, address, notes, workspace_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO UPDATE SET name=$2`, [v.id, v.name, v.address||null, v.notes||null, v.workspaceId||1]);
    }

    for (const p of projects) {
      await client.query(`INSERT INTO projects (id, name, description, start_date, end_date, workspace_id, is_festival, is_tour) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET name=$2`, [p.id, p.name, p.description||null, p.startDate||null, p.endDate||null, 1, p.isFestival||false, p.isTour||false]);
    }

    for (const e of events) {
      await client.query(`INSERT INTO events (id, name, start_date, end_date, venue_id, project_id, workspace_id, notes, color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO UPDATE SET name=$2`, [e.id, e.name, e.startDate||null, e.endDate||null, e.venueId||null, e.projectId||null, 1, e.notes||null, e.color||null]);
    }

    for (const s of schedules) {
      await client.query(`INSERT INTO schedules (id, title, category, start_time, end_time, event_date, event_name, location, description, workspace_id, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO UPDATE SET title=$2`, [s.id, s.title||'', s.category||'General', s.startTime, s.endTime||null, s.eventDate||null, s.eventName||null, s.location||null, s.description||null, 1, s.sortOrder||0]);
    }

    for (const c of contacts) {
      await client.query(`INSERT INTO contacts (id, first_name, last_name, role, phone, email, workspace_id) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET first_name=$2`, [c.id, c.firstName||'', c.lastName||null, c.role||null, c.phone||null, c.email||null, 1]);
    }

    for (const a of assignments) {
      await client.query(`INSERT INTO event_assignments (id, user_id, event_name, workspace_id) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`, [a.id, a.userId, a.eventName, 1]);
    }

    await client.query('COMMIT');
    console.log('Import successful!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
