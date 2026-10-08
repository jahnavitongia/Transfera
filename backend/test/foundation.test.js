const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
process.env.JWT_SECRET = "foundation-test-secret-only";
const app = require("../app");
const User = require("../models/user");
const testDatabase = "transfera_foundation_test";
let server, base, adminToken, staffToken, studentToken;
const request = async (route, method = "GET", body, token) => {
  const response = await fetch(base + route, { method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
};
before(async () => {
  await mongoose.connect(`mongodb://127.0.0.1:27018/${testDatabase}`);
  await User.init();
  const password = await bcrypt.hash("TestPassword123!", 4);
  for (const role of ["admin", "staff", "student"]) {
    await User.updateOne({ email: `${role}@example.test` }, { $set: { name: role, email: `${role}@example.test`, password, role } }, { upsert: true });
  }
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
  for (const role of ["admin", "staff", "student"]) {
    const result = await request("/auth/login", "POST", { email: `${role}@example.test`, password: "TestPassword123!" });
    assert.equal(result.status, 200);
    assert.equal(result.body.user.role, role);
    assert.equal(result.body.user.password, undefined);
    if (role === "admin") adminToken=result.body.token;
    if (role === "staff") staffToken=result.body.token;
    if (role === "student") studentToken=result.body.token;
  }
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1) {
    assert.equal(mongoose.connection.name, testDatabase);
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});
test("public signup cannot grant admin or staff", async () => {
  const result = await request("/auth/register", "POST", { name: "New Student", email: "new@example.test", password: "TestPassword123!", role: "admin" });
  assert.equal(result.status, 201); assert.equal(result.body.user.role, "student");
  const duplicate = await request("/auth/register", "POST", { name: "Again", email: "NEW@example.test", password: "TestPassword123!" });
  assert.equal(duplicate.status, 409);
});
test("only admin can appoint staff and caller cannot appoint another admin", async () => {
  const body = { name: "Review Staff", email: "appointed@example.test", password: "TestPassword123!", role: "admin" };
  assert.equal((await request("/auth/staff", "POST", body, studentToken)).status, 403);
  assert.equal((await request("/auth/staff", "POST", body, staffToken)).status, 403);
  const result = await request("/auth/staff", "POST", body, adminToken);
  assert.equal(result.status, 201); assert.equal(result.body.user.role, "staff");
});
test("student cannot read staff-wide data; staff can", async () => {
  for (const endpoint of ["/students", "/subjects", "/mappings/transfer/0123456789abcdef01234567", "/previous-subjects/transfer/0123456789abcdef01234567"]) {
    assert.equal((await request(endpoint, "GET", undefined, studentToken)).status, 403);
  }
  assert.deepEqual((await request("/transfers", "GET", undefined, studentToken)).body.transfers, []);
  assert.equal((await request("/students", "GET", undefined, staffToken)).status, 200);
  assert.equal((await request("/students")).status, 401);
});
test("invalid login and token are rejected; account endpoint identifies current user", async () => {
  assert.equal((await request("/auth/login", "POST", { email: "student@example.test", password: "wrong" })).status, 401);
  assert.equal((await request("/auth/me", "GET", undefined, "invalid")).status, 401);
  assert.equal((await request("/auth/me", "GET", undefined, studentToken)).body.user.role, "student");
  await User.updateOne({ email: "student@example.test" }, { $set: { role: "staff" } });
  assert.equal((await request("/auth/me", "GET", undefined, studentToken)).body.user.role, "staff");
});
test("invalid account details fail validation and health confirms database", async () => {
  assert.equal((await request("/auth/register", "POST", { name: "Invalid", email: "bad", password: "short" })).status, 400);
  assert.equal((await request("/health")).body.database, "connected");
});


test("demo login permits both loopback frontend addresses and excludes unrelated origins", async () => {
  for (const origin of ["http://localhost:5173", "http://127.0.0.1:5173"]) {
    const response = await fetch(base + "/auth/login", { method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ email: "admin@example.test", password: "TestPassword123!" }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
  }
  for (const origin of ["https://example.test", "http://localhost:5174"]) {
    const response = await fetch(base + "/auth/login", { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "POST" } });
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  }
});
