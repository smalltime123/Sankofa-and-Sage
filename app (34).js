import { menu, business, deliveryZones, menuCategories } from './menu-data.js';

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const money = (value) => `GH₵ ${Number(value).toFixed(2)}`;
const storageKey = 'sankofa-and-sage-cart-v1';
const maximumQuantity = 20;
const dishes = new Map(menu.map((dish) => [dish.id, dish]));
const plusIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>';
const leafIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 3C8 3 3 7 3 13a7 7 0 0 0 7 7c6 0 10-5 10-17Z"/><path d="m3 21 12-12"/></svg>';
const spiceIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3c2 1 3 3 2 5M15 7c5 1 7 5 4 9-3 4-9 5-15 5 4-3 4-7 6-10 1-2 3-4 5-4Z"/></svg>';
const state = { category: 'All', query: '', vegetarian: false, cart: readCart() };
let toastTimer;
let lastCartTrigger;

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([id, quantity]) => dishes.has(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= maximumQuantity));
  } catch {
    return {};
  }
}

function saveCart() {
  try { localStorage.setItem(storageKey, JSON.stringify(state.cart)); } catch { /* Ordering works when browser storage is unavailable. */ }
}

function toast(message) {
  const element = $('#toast');
  if (!element) return;
  clearTimeout(toastTimer);
  element.textContent = message;
  element.classList.add('visible');
  element.classList.add('show');
  toastTimer = setTimeout(() => {
    element.classList.remove('visible', 'show');
    element.textContent = '';
  }, 3500);
}

function renderTabs() {
  const tabs = $('#menu-tabs');
  if (!tabs) return;
  tabs.innerHTML = menuCategories.map((category) => `<button type="button" class="menu-tab${category === state.category ? ' active' : ''}" data-category="${escapeHTML(category)}" aria-pressed="${category === state.category}">${escapeHTML(category)}</button>`).join('');
}

function renderMenu() {
  const filtered = menu.filter((dish) => (state.category === 'All' || dish.category === state.category) && (!state.vegetarian || dish.vegetarian) && `${dish.name} ${dish.description} ${dish.category}`.toLowerCase().includes(state.query));
  if ($('#menu-count')) $('#menu-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'dish' : 'dishes'} to discover`;
  const grid = $('#menu-grid');
  if (!grid) return;
  if (!filtered.length) {
    grid.innerHTML = '<div class="menu-empty"><h3>No dishes found</h3><p>Try another search or reset your filters to explore the full menu.</p><button class="button button-secondary" type="button" data-reset-filters>Reset filters</button></div>';
    return;
  }
  grid.innerHTML = filtered.map((dish) => `<article class="dish-card">
    <div class="dish-image"><img src="${escapeHTML(dish.image.replace(/^\//, ''))}" alt="${escapeHTML(dish.name)}" loading="lazy" width="640" height="480">${dish.tag ? `<span class="dish-tag">${escapeHTML(dish.tag)}</span>` : ''}</div>
    <div class="dish-body"><div class="dish-meta"><span class="dish-category">${escapeHTML(dish.category)}</span><span class="dish-icons">${dish.vegetarian ? `<span class="diet-tag" title="Vegetarian">${leafIcon}<span class="sr-only">Vegetarian</span></span>` : ''}${dish.spicy ? `<span class="spice-tag" title="Contains chilli">${spiceIcon}<span class="sr-only">Contains chilli</span></span>` : ''}</span></div>
    <h3 class="dish-title">${escapeHTML(dish.name)}</h3><p class="dish-description">${escapeHTML(dish.description)}</p>
    <p class="dish-allergens">${dish.allergens?.length ? `Contains: ${escapeHTML(dish.allergens.join(', '))}` : 'Confirm ingredients when ordering.'}</p>
    <div class="dish-bottom"><span class="dish-price">${money(dish.price)}</span><button type="button" class="add-button" data-add="${escapeHTML(dish.id)}" aria-label="Add ${escapeHTML(dish.name)} to your order">${plusIcon}<span>Add</span></button></div></div>
  </article>`).join('');
}

function cartEntries() {
  return Object.entries(state.cart).map(([id, quantity]) => ({ ...dishes.get(id), quantity }));
}

function fulfillment() {
  return $('input[name="fulfillment"]:checked')?.value || 'delivery';
}

function zonesForBranch() {
  const branch = $('#branch')?.value || 'Accra';
  return branch === 'Accra' ? deliveryZones : [{ id: `${branch.toLowerCase()}-centre`, name: `${branch} city centre`, fee: 20 }];
}

function selectedZone() {
  return zonesForBranch().find((zone) => zone.id === $('#zone')?.value);
}

function totals() {
  const subtotal = cartEntries().reduce((sum, dish) => sum + dish.quantity * dish.price, 0);
  const fee = fulfillment() === 'pickup' || subtotal >= business.freeDeliveryThreshold || subtotal === 0 ? 0 : selectedZone()?.fee || 0;
  return { subtotal, fee, total: subtotal + fee };
}

function invalidateOrder() {
  const status = $('#checkout-status');
  if (status) { status.replaceChildren(); status.hidden = true; }
  const error = $('#checkout-error');
  if (error) { error.textContent = ''; error.hidden = true; }
}

function renderCart() {
  const entries = cartEntries();
  const quantity = entries.reduce((sum, dish) => sum + dish.quantity, 0);
  if ($('#mobile-cart-open')) $('#mobile-cart-open').hidden = quantity === 0;
  const { subtotal, fee, total } = totals();
  for (const selector of ['#cart-count', '#mobile-cart-count']) {
    const element = $(selector);
    if (element) element.textContent = String(quantity);
  }
  for (const selector of ['#cart-open', '#mobile-cart-open']) {
    const element = $(selector);
    if (element) element.setAttribute('aria-label', `Open your order, ${quantity} ${quantity === 1 ? 'item' : 'items'}`);
  }
  if ($('#mobile-cart-total')) $('#mobile-cart-total').textContent = money(subtotal);
  if ($('#cart-subtotal')) $('#cart-subtotal').textContent = money(subtotal);
  if ($('#cart-delivery')) $('#cart-delivery').textContent = fulfillment() === 'pickup' ? 'Free pickup' : subtotal >= business.freeDeliveryThreshold ? 'Free · sample offer' : `${money(fee)} · sample fee`;
  if ($('#cart-total')) $('#cart-total').textContent = money(total);
  if ($('#cart-empty')) $('#cart-empty').hidden = entries.length > 0;
  if ($('#checkout-form')) $('#checkout-form').hidden = entries.length === 0;
  if ($('#checkout-submit')) $('#checkout-submit').disabled = entries.length === 0;
  const cartItems = $('#cart-items');
  if (cartItems) cartItems.innerHTML = entries.map((dish) => `<article class="cart-item">
    <img src="${escapeHTML(dish.image.replace(/^\//, ''))}" alt="" width="72" height="72" loading="lazy">
    <div class="cart-item-details"><h3>${escapeHTML(dish.name)}</h3><p>${money(dish.price)} each</p><div class="quantity-control"><button type="button" data-cart-action="decrease" data-id="${escapeHTML(dish.id)}" aria-label="Decrease quantity of ${escapeHTML(dish.name)}">−</button><span aria-label="Quantity">${dish.quantity}</span><button type="button" data-cart-action="increase" data-id="${escapeHTML(dish.id)}" aria-label="Increase quantity of ${escapeHTML(dish.name)}"${dish.quantity >= maximumQuantity ? ' disabled' : ''}>+</button></div></div>
    <div class="cart-item-right"><strong>${money(dish.price * dish.quantity)}</strong><button type="button" class="remove-item" data-cart-action="remove" data-id="${escapeHTML(dish.id)}" aria-label="Remove ${escapeHTML(dish.name)}">Remove</button></div>
  </article>`).join('');
}

function changeQuantity(id, difference) {
  if (!dishes.has(id)) return;
  const next = (state.cart[id] || 0) + difference;
  if (next > maximumQuantity) { toast(`You can add up to ${maximumQuantity} of each dish.`); return; }
  if (next <= 0) delete state.cart[id];
  else state.cart[id] = next;
  saveCart();
  invalidateOrder();
  renderCart();
}

function populateZones() {
  const select = $('#zone');
  if (!select) return;
  const previous = select.value;
  const zones = zonesForBranch();
  select.innerHTML = zones.map((zone) => `<option value="${escapeHTML(zone.id)}">${escapeHTML(zone.name)} — ${money(zone.fee)} sample fee</option>`).join('');
  if (zones.some((zone) => zone.id === previous)) select.value = previous;
}

function updateFulfillment() {
  const delivery = fulfillment() === 'delivery';
  if ($('#delivery-fields')) $('#delivery-fields').hidden = !delivery;
  if ($('#customer-address')) { $('#customer-address').required = delivery; $('#customer-address').disabled = !delivery; }
  if ($('#zone')) { $('#zone').required = delivery; $('#zone').disabled = !delivery; }
  invalidateOrder();
  renderCart();
}

function openCart(event) {
  lastCartTrigger = event?.currentTarget || document.activeElement;
  const dialog = $('#cart-dialog');
  if (!dialog) return;
  renderCart();
  if (!dialog.open) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  document.body.classList.add('cart-is-open');
  $('#cart-close')?.focus();
}

function closeCart() {
  const dialog = $('#cart-dialog');
  if (typeof dialog?.close === 'function') dialog.close();
  else dialog?.removeAttribute('open');
  document.body.classList.remove('cart-is-open');
  lastCartTrigger?.focus();
}

function phoneIsValid(value) {
  const compact = value.replace(/[\s()-]/g, '');
  if (compact.startsWith('+233') || compact.startsWith('233')) return /^\+?233\d{9}$/.test(compact);
  if (compact.startsWith('0')) return /^0\d{9}$/.test(compact);
  return /^\+[1-9]\d{7,14}$/.test(compact);
}

function checkoutError(message, focusElement) {
  const element = $('#checkout-error');
  if (element) { element.textContent = message; element.hidden = false; }
  focusElement?.focus();
}

function checkout(event) {
  event.preventDefault();
  invalidateOrder();
  if (!cartEntries().length) { checkoutError('Add at least one dish before sending your order.'); return; }
  const form = $('#checkout-form');
  if (form && !form.reportValidity()) return;
  const name = $('#customer-name')?.value.trim() || '';
  const phone = $('#customer-phone')?.value.trim() || '';
  const address = $('#customer-address')?.value.trim() || '';
  const notes = $('#order-notes')?.value.trim() || '';
  const branch = $('#branch')?.value || 'Accra';
  const type = fulfillment();
  const zone = selectedZone();
  if (name.length < 2) { checkoutError('Enter your name so the restaurant can confirm your order.', $('#customer-name')); return; }
  if (!phoneIsValid(phone)) { checkoutError('Enter a valid phone number, for example 0554510756 or +233554510756. Use + and your country code for an international number.', $('#customer-phone')); return; }
  if (type === 'delivery' && !zone) { checkoutError('Choose a delivery area.', $('#zone')); return; }
  if (type === 'delivery' && address.length < 5) { checkoutError('Enter a delivery address with a nearby landmark.', $('#customer-address')); return; }
  const { subtotal, fee, total } = totals();
  const payment = $('#payment')?.value === 'mobile-money' ? 'Mobile money (please confirm payment instructions)' : 'Cash on delivery / collection';
  const lines = [
    `Hello ${business.name}, I would like to request this order.`,
    '',
    ...cartEntries().map((dish) => `${dish.quantity} × ${dish.name} — ${money(dish.quantity * dish.price)}`),
    '',
    `Subtotal: ${money(subtotal)}`,
    `${type === 'pickup' ? 'Pickup' : 'Delivery'} fee: ${money(fee)}`,
    `Estimated total: ${money(total)}`,
    'Menu prices and delivery fees are sample amounts; please confirm the final total and availability.',
    '',
    `Branch: ${branch}`,
    `Fulfillment: ${type === 'delivery' ? 'Delivery' : 'Pickup'}`,
    ...(type === 'delivery' ? [`Delivery area: ${zone.name}`, `Address / landmark: ${address}`] : []),
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Payment preference: ${payment}`,
    ...(notes ? [`Order notes: ${notes}`] : []),
    '',
    'Please confirm this order, the final price, and the delivery or collection time.',
  ];
  const url = `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  const status = $('#checkout-status');
  if (status) {
    const message = document.createElement('p');
    message.textContent = 'Your order is ready in WhatsApp. Tap Send there to request confirmation.';
    const link = document.createElement('a');
    link.id = 'whatsapp-fallback';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open your order in WhatsApp';
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'copy-order-button';
    copyButton.textContent = 'Copy order details';
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(lines.join('\n'));
        copyButton.textContent = 'Order details copied';
      } catch {
        const text = document.createElement('textarea');
        text.value = lines.join('\n');
        text.className = 'order-copy-text';
        text.readOnly = true;
        status.append(text);
        text.focus();
        text.select();
        copyButton.textContent = 'Select and copy the details below';
      }
    });
    status.replaceChildren(message, link, copyButton);
    status.hidden = false;
    // A link opened during this submit event keeps the WhatsApp handoff customer-initiated.
    link.click();
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.append(link);
    link.click();
    link.remove();
  }
}

function initialize() {
  if ($('#year')) $('#year').textContent = String(new Date().getFullYear());
  $('#privacy-open')?.addEventListener('click', () => $('#privacy-dialog')?.showModal());
  $('#privacy-close')?.addEventListener('click', () => $('#privacy-dialog')?.close());
  $('#privacy-dialog')?.addEventListener('click', (event) => {
    if (event.target !== $('#privacy-dialog')) return;
    const box = event.target.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) event.target.close();
  });
  renderTabs();
  renderMenu();
  const branch = $('#branch');
  if (branch) {
    branch.innerHTML = business.branches.map((name) => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
    branch.addEventListener('change', () => { populateZones(); invalidateOrder(); renderCart(); });
  }
  populateZones();
  updateFulfillment();
  $('#zone')?.addEventListener('change', () => { invalidateOrder(); renderCart(); });
  $('#menu-search')?.addEventListener('input', (event) => { state.query = event.target.value.trim().toLowerCase(); renderMenu(); });
  $('#dietary-toggle')?.addEventListener('change', (event) => { state.vegetarian = event.target.checked; renderMenu(); });
  $('#menu-tabs')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    for (const tab of $('#menu-tabs').querySelectorAll('[data-category]')) {
      const active = tab.dataset.category === state.category;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', String(active));
    }
    renderMenu();
  });
  $('#menu-grid')?.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add]');
    if (add) {
      const previous = state.cart[add.dataset.add] || 0;
      changeQuantity(add.dataset.add, 1);
      if (previous < maximumQuantity) toast(`${dishes.get(add.dataset.add).name} added to your order.`);
    }
    if (event.target.closest('[data-reset-filters]')) {
      state.category = 'All'; state.query = ''; state.vegetarian = false;
      if ($('#menu-search')) $('#menu-search').value = '';
      if ($('#dietary-toggle')) $('#dietary-toggle').checked = false;
      renderTabs(); renderMenu();
    }
  });
  $('#cart-items')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.cartAction;
    if (action === 'remove') { delete state.cart[id]; saveCart(); invalidateOrder(); renderCart(); }
    else changeQuantity(id, action === 'increase' ? 1 : -1);
    const replacement = $('#cart-items')?.querySelector(`[data-id="${CSS.escape(id)}"][data-cart-action="${action}"]`);
    if (replacement && !replacement.disabled) replacement.focus();
    else $('#checkout-submit')?.focus();
  });
  $('#cart-open')?.addEventListener('click', openCart);
  $('#mobile-cart-open')?.addEventListener('click', openCart);
  document.querySelectorAll('[data-open-cart]').forEach((element) => element.addEventListener('click', openCart));
  $('#cart-close')?.addEventListener('click', closeCart);
  $('#cart-dialog')?.addEventListener('close', () => { document.body.classList.remove('cart-is-open'); lastCartTrigger?.focus(); });
  $('#cart-dialog')?.addEventListener('click', (event) => {
    if (event.target === $('#cart-dialog')) {
      const box = event.target.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeCart();
    }
  });
  document.querySelectorAll('input[name="fulfillment"]').forEach((radio) => radio.addEventListener('change', updateFulfillment));
  $('#checkout-form')?.addEventListener('submit', checkout);
  $('#checkout-form')?.addEventListener('input', invalidateOrder);
  $('#checkout-form')?.addEventListener('change', invalidateOrder);
  const navButton = $('#menu-toggle');
  const mobileNav = $('#mobile-nav');
  if (navButton && mobileNav) {
    navButton.addEventListener('click', () => {
      const expanded = navButton.getAttribute('aria-expanded') !== 'true';
      navButton.setAttribute('aria-expanded', String(expanded));
      mobileNav.hidden = !expanded;
    });
    mobileNav.addEventListener('click', (event) => {
      if (event.target.closest('a')) { mobileNav.hidden = true; navButton.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navButton.getAttribute('aria-expanded') === 'true') { mobileNav.hidden = true; navButton.setAttribute('aria-expanded', 'false'); navButton.focus(); }
    });
  }
  const sectionZone = $('#delivery-zone');
  if (sectionZone) {
    sectionZone.innerHTML = deliveryZones.map((zone) => `<option value="${escapeHTML(zone.id)}">${escapeHTML(zone.name)} — ${money(zone.fee)} sample fee</option>`).join('');
    sectionZone.addEventListener('change', () => {
      if (branch) branch.value = 'Accra';
      populateZones();
      if ($('#zone')) $('#zone').value = sectionZone.value;
      invalidateOrder(); renderCart();
    });
  }
}

initialize();
