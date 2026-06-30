async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testapiuser',
        password: 'testapipassword'
      })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response text:', text);
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}
test();
