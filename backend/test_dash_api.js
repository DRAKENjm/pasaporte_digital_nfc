async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/admin/dashboard');
    if (!res.ok) {
      console.log("Status:", res.status);
      const text = await res.text();
      console.log("Body:", text);
    } else {
      const data = await res.json();
      console.log("Success:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}
test();
