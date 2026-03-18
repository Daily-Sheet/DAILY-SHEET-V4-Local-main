import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;
const pool = new Pool({
  connectionString: "postgresql://event_hub_db_d3xz_user:bRJjJLtsGxh1XD97JcVSul0OFE8Ktg7j@dpg-d6jmr3ngi27c738869dg-a.oregon-postgres.render.com/event_hub_db_d3xz",
  ssl: { rejectUnauthorized: false }
});

const travelDays = JSON.parse(fs.readFileSync('td9.json'));

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const td of travelDays) {
      await client.query(`INSERT INTO travel_days (id, project_id, date, notes, flight_number, airline, departure_airport, arrival_airport, departure_time, arrival_time, workspace_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO UPDATE SET date=$3`,
        [td.id, td.projectId, td.date, td.notes, td.flightNumber, td.airline, td.departureAirport, td.arrivalAirport, td.departureTime, td.arrivalTime, td.workspaceId||1]);
    }
    await client.query('COMMIT');
    console.log('Travel days imported!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
