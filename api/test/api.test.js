import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

class MemoryKV {
  value = null;
  async get(_key, type) { return type === "json" && this.value ? JSON.parse(this.value) : this.value; }
  async put(_key, value) { this.value = value; }
}

const env = () => ({ BLACKLIST_KV: new MemoryKV(), ADMIN_API_TOKEN: "secret", MAX_DOMAINS: "20000" });

test("fallback blacklist tersedia saat KV kosong", async () => {
  const response = await worker.fetch(new Request("https://example.com/v1/blacklist"), env());
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).domains, []);
});

test("admin dapat memperbarui dan API menormalisasi domain", async () => {
  const bindings = env();
  const update = await worker.fetch(new Request("https://example.com/v1/blacklist", {
    method: "PUT",
    headers: { Authorization: "Bearer secret", "Content-Type": "application/json" },
    body: JSON.stringify({ version: "test-1", domains: ["WWW.Example.test", "example.test", "tidak valid"] }),
  }), bindings);
  assert.equal(update.status, 200);
  assert.equal((await update.json()).count, 1);
  const response = await worker.fetch(new Request("https://example.com/v1/blacklist"), bindings);
  assert.deepEqual((await response.json()).domains, ["example.test"]);
});

test("admin endpoint menolak token salah", async () => {
  const response = await worker.fetch(new Request("https://example.com/v1/blacklist", {
    method: "PUT", headers: { Authorization: "Bearer salah" }, body: JSON.stringify({ domains: [] }),
  }), env());
  assert.equal(response.status, 401);
});

test("ETag mengembalikan 304", async () => {
  const bindings = env();
  const first = await worker.fetch(new Request("https://example.com/v1/blacklist"), bindings);
  const second = await worker.fetch(new Request("https://example.com/v1/blacklist", { headers: { "If-None-Match": first.headers.get("ETag") } }), bindings);
  assert.equal(second.status, 304);
});
