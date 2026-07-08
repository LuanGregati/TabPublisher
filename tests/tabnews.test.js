const assert = require("assert");
const { parseNews } = require("../lib/newsParser");

const sample = `https://example.com/one
https://example.com/two
Title one: Body one. As informações são dos sites Example e Test.

https://example.com/three
Title three: Body three. As informações são do site Example.
`;

const parsed = parseNews(sample);

assert.strictEqual(parsed.length, 2, "Deveria parser 2 notícias");
assert.strictEqual(parsed[0].title, "Title one");
assert.deepStrictEqual(parsed[0].sources, [
  "https://example.com/one",
  "https://example.com/two",
]);
assert.strictEqual(
  parsed[0].body,
  "Body one.\n\nFontes:\n- https://example.com/one\n- https://example.com/two",
);
assert.strictEqual(parsed[1].body, "Body three.");

console.log("All parseNews tests passed");
