async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@pasaporte.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log("Login Response:", loginData);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
