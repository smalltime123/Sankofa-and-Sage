import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { menu, menuCategories, business, deliveryZones } from '../menu-data.js';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const file of ['app.js', 'menu-data.js', 'scripts/dev-server.mjs', 'scripts/build.mjs']) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${file}: ${result.stderr}`);
}
assert.ok(menu.length > 0, 'Add at least one menu item.');
assert.equal(new Set(menu.map(dish => dish.id)).size, menu.length, 'Every dish needs a unique id.');
assert.match(business.whatsappNumber, /^[1-9]\d{7,14}$/, 'Use the full WhatsApp country code without + or spaces.');
assert.ok(Number.isFinite(business.freeDeliveryThreshold) && business.freeDeliveryThreshold >= 0);
for (const dish of menu) {
  assert.ok(dish.id && dish.name && dish.description, 'Each dish needs an id, name and description.');
  assert.ok(menuCategories.includes(dish.category), `Unknown category for ${dish.name}.`);
  assert.ok(Number.isFinite(dish.price) && dish.price >= 0, `Invalid price for ${dish.name}.`);
  assert.ok(!dish.image.startsWith('/'), `Use a relative image path for ${dish.name} so it works on GitHub Pages.`);
  await access(path.join(root, dish.image));
}
for (const zone of deliveryZones) assert.ok(Number.isFinite(zone.fee) && zone.fee >= 0, `Invalid fee for ${zone.name}.`);
for (const file of ['index.html', 'photo-credits.html']) {
  const source = await readFile(path.join(root, file), 'utf8');
  assert.ok(!/\b(?:src|href)=["']\/(?!\/)/.test(source), `${file} contains a root-relative URL that can break project Pages.`);
  for (const match of source.matchAll(/\b(?:src|href)=["'](\.[^"']*)["']/g)) {
    await access(path.join(root, match[1].split(/[?#]/)[0]));
  }
}
const css = await readFile(path.join(root, 'styles.css'), 'utf8');
assert.ok(!/url\(["']?\/(?!\/)/.test(css), 'Use relative CSS asset URLs.');
for (const match of css.matchAll(/url\(["']?(\.\/?[^"')]+)["']?\)/g)) await access(path.join(root, match[1]));
console.log(`Checks passed: ${menu.length} dishes, delivery fees, WhatsApp number, JavaScript syntax and local assets.`);
