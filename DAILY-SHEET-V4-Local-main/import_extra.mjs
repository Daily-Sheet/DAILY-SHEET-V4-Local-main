import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;
const pool = new Pool({
  connectionString: "postgresql://event_hub_db_d3xz_user:bRJjJLtsGxh1XD97JcVSul0OFE8Ktg7j@dpg-d6jmr3ngi27c738869dg-a.oregon-postgres.render.com/event_hub_db_d3xz",
  ssl: { rejectUnauthorized: false }
});

const zones = JSON.parse(fs.readFileSync('prod_zones.json'));
const sections = JSON.parse(fs.readFileSync('prod_sections.json'));
const travelDays = JSON.parse(fs.readFileSync('prod_traveldays.json'));
const projectAssignments = JSON.parse(fs.readFileSync('prod_projectassignments.json'));
const taskTypes = JSON.parse(fs.readFileSync('prod_tasktypes.json'));
const departments = JSON.parse(fs.readFileSync('prod_departments.json'));
const crewPositions = JSON.parse(fs.readFileSync('prod_crewpositions.json'));
const dayVenues = JSON.parse(fs.readFileSync('prod_dayvenues.json'));

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const z of zones) {
      await client.query(`INSERT INTO zones (id, name, workspace_id) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=$2`, [z.id, z.name, z.workspaceId||1]);
    }

    for (const s of sections) {
      await client.query(`INSERT INTO sections (id, name, workspace_id) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=$2`, [s.id, s.name, s.workspaceId||1]);
    }

    for (const t of taskTypes) {
      await client.query(`INSERT INTO task_types (id, name, workspace_id) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=$2`, [t.id, t.name, t.workspaceId||1]);
    }

    for (const d of departments) {
      await client.query(`INSERT INTO departments (id, name, workspace_id) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=$2`, [d.id, d.name, d.workspaceId||1]);
    }

    for (const c of crewPositions) {
      await client.query(`INSERT INTO crew_positions (id, name, workspace_id) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=$2`, [c.id, c.name, c.workspaceId||1]);
    }

    for (const dv of dayVenues) {
      await client.query(`INSERT INTO event_day_venues (id, event_id, venue_id, event_date, workspace_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`, [dv.id, dv.eventId, dv.venueId, dv.eventDate, dv.workspaceId||1]);
    }

    for (const pa of projectAssignments) {
      await client.query(`INSERT INTO project_assignments (id, user_id, project_id, workspace_id) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`, [pa.id, pa.userId, pa.projectId, pa.workspaceId||1]);
    }

    for (const td of travelDays) {
      await client.query(`INSERT INTO travel_days (id, project_id, travel_date, origin, destination, notes, workspace_id) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET destination=$5`, [td.id, td.projectId, td.travelDate, td.origin||null, td.destination||null, td.notes||null, td.workspaceId||1]);
    }

    await client.query('COMMIT');
    console.log('Extra import successful!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
