// Helper script to insert 2025 mock reservations directly into Supabase
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://vclckkfpydwjqxxqdznd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xF1R87snCXRQHc5TBRFPzw_DAlaxoT2";

async function insertMockData() {
  const jsonPath = path.join(__dirname, 'mock_reservations_2025.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('File not found:', jsonPath);
    return;
  }

  const records = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Found ${records.length} records to insert for Year 2025...`);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/reservations`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(records)
  });

  if (response.ok) {
    console.log(`Successfully inserted all ${records.length} mock reservations for 2025!`);
    console.log(`Open your Admin Dashboard and switch the Analytics filter to 'Yearly (2025)' to view the charts!`);
  } else {
    const errText = await response.text();
    console.error('Error inserting records:', response.status, errText);
    console.log('You can also paste mock_reservations_2025.sql into your Supabase SQL Editor directly.');
  }
}

insertMockData();
