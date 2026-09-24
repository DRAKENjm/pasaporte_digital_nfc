const { PGlite } = require("@electric-sql/pglite");
const { uuid_ossp } = require("@electric-sql/pglite/contrib/uuid_ossp");
const fs = require("fs"),
  path = require("path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../..");
process.env.JWT_SECRET =
  "test-only-secret-abcdefghijklmnopqrstuvwxyz0123456789";
process.env.NODE_ENV = "test";
process.env.REQUIRE_EMAIL_VERIFICATION = "false";
process.env.DATABASE_URL = "postgres://invalid/isolated";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";
(async () => {
  const db = new PGlite({ extensions: { uuid_ossp } });
  await db.exec(fs.readFileSync(root + "/pasaporte.sql", "utf8"));
  await db.exec(
    fs.readFileSync(root + "/backend/migrations/002_features.sql", "utf8"),
  );
  await db.exec(
    fs.readFileSync(root + "/backend/migrations/002_features.sql", "utf8"),
  );
  const cfg = require(root + "/backend/dist/config/database");
  const query = async (s, p) => {
    const r = await db.query(s, p);
    return { ...r, rowCount: r.rows.length || r.affectedRows || 0 };
  };
  cfg.query = query;
  cfg.pool.connect = async () => ({ query, release() {} });
  const express = require(root + "/backend/node_modules/express");
  const app = express();
  app.use(express.json({ limit: "8mb" }));
  app.use("/api", require(root + "/backend/dist/routes").default);
  app.use((e, req, res, next) =>
    res.status(e.statusCode || 500).json({ message: e.message }),
  );
  const request = require("supertest")(app);
  let checks = 0;
  const ok = (condition, label) => {
    assert.ok(condition, label);
    console.log("PASS", label);
    checks++;
  };
  async function register(email, role = "CLIENTE") {
    const r = await request
      .post("/api/auth/register")
      .send({
        email,
        password: "Testpass123",
        nombres: "Test",
        apellidos: "User",
        roleName: role,
      });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    return (await query("SELECT id FROM usuarios WHERE email=$1", [email]))
      .rows[0].id;
  }
  const alice = await register("alice@example.test", "ADMIN"),
    bob = await register("bob@example.test"),
    staff = await register("staff@example.test"),
    admin = await register("admin@example.test");
  ok(
    (
      await query(
        "SELECT r.nombre FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.id=$1",
        [alice],
      )
    ).rows[0].nombre === "CLIENTE",
    "signup cannot select ADMIN",
  );
  for (const [id, role] of [
    [staff, "COMERCIO"],
    [admin, "ADMIN"],
  ])
    await query(
      "UPDATE usuarios SET rol_id=(SELECT id FROM roles WHERE nombre=$2) WHERE id=$1",
      [id, role],
    );
  async function login(email) {
    const r = await request
      .post("/api/auth/login")
      .send({ email, password: "Testpass123" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.body.data.token;
  }
  const ta = await login("alice@example.test"),
    tb = await login("bob@example.test"),
    ts = await login("staff@example.test"),
    td = await login("admin@example.test");
  const auth = (t) => ({ Authorization: "Bearer " + t, "User-Agent": "Test" });
  const pixel =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
  let r = await request
    .post("/api/social/historias")
    .set(auth(ta))
    .send({ mediaUrl: pixel, caption: "Mi historia" });
  ok(r.status === 201, "story create");
  const sid = r.body.data.id;
  r = await request.get("/api/social/historias").set(auth(tb));
  ok(
    r.body.data.some((x) => x.id === sid),
    "story visible to another user",
  );
  r = await request.delete("/api/social/historias/" + sid).set(auth(tb));
  ok(r.status === 404, "other user cannot delete story");
  r = await request.delete("/api/social/historias/" + sid).set(auth(ta));
  ok(r.status === 200, "author can delete story");
  r = await request.get("/api/social/historias").set(auth(ta));
  ok(!r.body.data.some((x) => x.id === sid), "deleted story remains absent");
  r = await request
    .post("/api/social/historias")
    .set(auth(ta))
    .send({ mediaUrl: pixel });
  await query(
    "UPDATE historias SET expires_at=now()-interval '1 second' WHERE id=$1",
    [r.body.data.id],
  );
  r = await request.get("/api/social/historias").set(auth(ta));
  ok(r.body.data.length === 0, "expired stories excluded");
  r = await request
    .post("/api/social/publicaciones")
    .set(auth(ta))
    .send({ texto_contenido: "Experiencia", url_media: pixel });
  ok(r.status === 201, "photo post persists");
  const post = r.body.data.id;
  r = await request.get("/api/social/publicaciones/" + post);
  ok(
    r.status === 200 && r.body.data.url_media === pixel,
    "public share URL opens without login",
  );
  r = await request
    .post("/api/social/interacciones")
    .set(auth(tb))
    .send({ publicacion_id: post, tipo: "REACCION" });
  ok(r.status === 201, "like persists");
  r = await request.get("/api/social/feed").set(auth(tb));
  ok(
    r.body.data[0].likes_count === 1 && r.body.data[0].has_liked,
    "feed returns actual likes",
  );
  await request
    .post("/api/social/interacciones")
    .set(auth(tb))
    .send({ publicacion_id: post, tipo: "REACCION" });
  r = await request.get("/api/social/feed").set(auth(tb));
  ok(r.body.data[0].likes_count === 0, "like toggles off");
  r = await request
    .post("/api/social/interacciones")
    .set(auth(tb))
    .send({ publicacion_id: post, tipo: "COMENTARIO", comentario: "Genial" });
  r = await request
    .get(`/api/social/publicaciones/${post}/comentarios`)
    .set(auth(ta));
  ok(r.body.data[0].comentario === "Genial", "comments persist");
  r = await request
    .post("/api/establishments")
    .set(auth(td))
    .send({ ruc: "12345678901", razon_social: "Local test" });
  const local = r.body.data.id;
  await request
    .patch("/api/establishments/" + local)
    .set(auth(td))
    .send({ lat: -6.77, lng: -79.84 });
  r = await request.get("/api/establishments/" + local).set(auth(ta));
  ok(r.body.data.lat === -6.77, "coordinates persist");
  await request
    .post(`/api/establishments/${local}/reglas`)
    .set(auth(td))
    .send({
      nombre_accion: "Visita",
      valor_puntos_por_sello: 10,
      limite_diario_por_usuario: 2,
    });
  r = await request.get("/api/nfc/qr").set(auth(ta));
  const qr = r.body.data.token;
  ok(!!qr, "signed QR issued");
  r = await request
    .post("/api/nfc/validar-qr")
    .set(auth(ts))
    .send({ token: qr, establecimiento_id: local });
  ok(r.status === 403, "unassigned commerce rejected");
  await request
    .post(`/api/establishments/${local}/personal`)
    .set(auth(td))
    .send({ usuario_id: staff });
  r = await request
    .post("/api/nfc/validar-qr")
    .set(auth(ts))
    .send({ token: qr, establecimiento_id: local });
  ok(
    r.status === 200 && r.body.data.puntos_acreditados === 10,
    "QR credits points",
  );
  r = await request
    .post("/api/nfc/validar-qr")
    .set(auth(ts))
    .send({ token: qr, establecimiento_id: local });
  ok(r.status === 409, "QR replay rejected");
  const jwt = require(root + "/backend/node_modules/jsonwebtoken");
  const expired = jwt.sign(
    { sub: alice, purpose: "visit", jti: crypto.randomUUID() },
    process.env.JWT_SECRET,
    { audience: "pasaporte-visit", expiresIn: -1 },
  );
  r = await request
    .post("/api/nfc/validar-qr")
    .set(auth(ts))
    .send({ token: expired, establecimiento_id: local });
  ok(r.status === 400, "expired QR rejected");
  await request
    .post("/api/nfc/asignar-tarjeta")
    .set(auth(ta))
    .send({ uid_nfc: "04:AA:BB" });
  r = await request
    .post("/api/nfc/asignar-tarjeta")
    .set(auth(tb))
    .send({ uid_nfc: "04:AA:BB" });
  ok(r.status === 409, "cannot steal assigned NFC card");
  r = await request
    .post("/api/nfc/validar-nfc")
    .set(auth(ts))
    .send({ uid_nfc: "04:aa:bb", establecimiento_id: local });
  ok(r.status === 200, "NFC resolves UID and credits");
  r = await request
    .post("/api/nfc/validar-nfc")
    .set(auth(ts))
    .send({ uid_nfc: "04:AA:BB", establecimiento_id: local });
  ok(r.status === 429, "daily cap enforced");
  r = await request.get("/api/auth/profile").set(auth(ta));
  ok(
    r.body.data.puntos_globales === 20 && r.body.data.total_sellos === 2,
    "points and visits consistent",
  );
  r = await request
    .patch("/api/auth/profile")
    .set(auth(ta))
    .send({ nombres: "Actualizado", avatar_url: pixel });
  ok(r.status === 200, "profile and avatar update");
  const token = "recovery-test",
    hash = require("crypto").createHash("sha256").update(token).digest("hex");
  await query(
    "INSERT INTO auth_tokens VALUES($1,$2,'reset',now()+interval '5 minutes')",
    [hash, bob],
  );
  r = await request
    .post("/api/auth/reset-password")
    .send({ token, password: "Newpass123" });
  ok(r.status === 200, "password reset");
  r = await request
    .post("/api/auth/reset-password")
    .send({ token, password: "Otherpass123" });
  ok(r.status === 400, "reset token single use");
  await query("UPDATE usuarios SET estado='BLOQUEADO' WHERE id=$1", [bob]);
  r = await request.get("/api/auth/profile").set(auth(tb));
  ok(r.status === 401, "blocked user loses existing session");
  console.log(
    `\n${checks} assertions passed; schema and migration validated twice.`,
  );
  if (process.env.SERVE_TEST === "1") {
    app.listen(5000, () => console.log("ISOLATED TEST API :5000"));
    return;
  }
  await db.close();
  await cfg.pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
