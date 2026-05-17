const test = async () => {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Got token:', !!token);

    // 2. Test Stats
    const statsRes = await fetch('http://localhost:5000/api/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const statsData = await statsRes.json();
    console.log('\n--- STATS ---');
    console.log(statsData);

    // 3. Test Applications
    const appsRes = await fetch('http://localhost:5000/api/applications?page=1&platform=linkedin', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const appsData = await appsRes.json();
    console.log('\n--- APPLICATIONS (LinkedIn) ---');
    console.log(`Total LinkedIn: ${appsData.totalItems}, Current Page: ${appsData.currentPage}`);

    // 4. Test CSV Export
    const csvRes = await fetch('http://localhost:5000/api/applications/export', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const csvData = await csvRes.text();
    console.log('\n--- CSV EXPORT ---');
    console.log(csvData.substring(0, 200) + '...');

  } catch (err) {
    console.error(err);
  }
};
test();
