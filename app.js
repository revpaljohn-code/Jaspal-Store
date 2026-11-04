const products = [
  {
    id: "day-tote",
    name: "The Day Tote",
    category: "carry",
    label: "Best seller",
    detail: "Carry · Recycled canvas",
    price: 48,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=720&q=85",
    alt: "Natural canvas tote bag"
  },
  {
    id: "daily-bottle",
    name: "Daily Bottle",
    category: "carry",
    label: "Made to move",
    detail: "Carry · Stainless steel",
    price: 36,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=720&q=85",
    alt: "Reusable water bottle"
  },
  {
    id: "slow-cup",
    name: "Slow Morning Cup",
    category: "home",
    label: "",
    detail: "Home · Stoneware",
    price: 28,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=720&q=85",
    alt: "Handmade ceramic coffee cup"
  },
  {
    id: "weekend-pouch",
    name: "Weekend Pouch",
    category: "carry",
    label: "Just arrived",
    detail: "Carry · Organic cotton",
    price: 32,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=720&q=85",
    alt: "Minimal everyday carry pouch"
  }
];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const productGrid = document.querySelector("#product-grid");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#product-search");
const cart = new Map();
let activeFilter = "all";
let toastTimeout;

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesFilter = activeFilter === "all" || product.category === activeFilter;
    const matchesQuery = `${product.name} ${product.detail}`.toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  });

  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-image image-${product.id.split("-")[1]}">
        <img src="${product.image}" alt="${product.alt}" loading="lazy">
        ${product.label ? `<span class="product-tag">${product.label}</span>` : ""}
        <button class="quick-add" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag">+</button>
      </div>
      <div class="product-info">
        <div>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-category">${product.detail}</p>
        </div>
        <p class="product-price">${money.format(product.price)}</p>
      </div>
    </article>
  `).join("");
  emptyState.hidden = visibleProducts.length > 0;
}

function cartQuantity() {
  return [...cart.values()].reduce((sum, quantity) => sum + quantity, 0);
}

function renderCart() {
  const quantity = cartQuantity();
  const items = [...cart.entries()].map(([id, count]) => {
    const product = products.find((entry) => entry.id === id);
    return { ...product, count };
  });

  document.querySelector("#cart-count").textContent = quantity;
  document.querySelector("#drawer-count").textContent = `(${quantity})`;
  document.querySelector("#cart-items").innerHTML = items.map((item) => `
    <div class="cart-line">
      <img class="cart-thumb" src="${item.image}" alt="">
      <div>
        <h3 class="cart-line-name">${item.name}</h3>
        <p class="cart-line-price">${money.format(item.price)}</p>
        <div class="quantity-control" aria-label="Quantity for ${item.name}">
          <button type="button" data-quantity="${item.id}" data-change="-1" aria-label="Remove one ${item.name}">−</button>
          <span>${item.count}</span>
          <button type="button" data-quantity="${item.id}" data-change="1" aria-label="Add one ${item.name}">+</button>
        </div>
      </div>
      <button class="remove-item" type="button" data-remove="${item.id}">Remove</button>
    </div>
  `).join("");
  document.querySelector("#cart-subtotal").textContent = money.format(
    items.reduce((sum, item) => sum + item.price * item.count, 0)
  );
  document.querySelector("#cart-empty").hidden = items.length > 0;
  document.querySelector("#drawer-footer").hidden = items.length === 0;
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function setCartOpen(isOpen) {
  const drawer = document.querySelector("#cart-drawer");
  const backdrop = document.querySelector("#drawer-backdrop");
  drawer.classList.toggle("is-open", isOpen);
  drawer.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("drawer-open", isOpen);
  backdrop.hidden = !isOpen;
  if (isOpen) {
    window.requestAnimationFrame(() => backdrop.classList.add("is-visible"));
    document.querySelector("#cart-close").focus();
  } else {
    backdrop.classList.remove("is-visible");
    document.querySelector("#cart-open").focus();
  }
}

document.querySelector(".filter-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  document.querySelectorAll(".filter-button").forEach((filterButton) => {
    const isActive = filterButton === button;
    filterButton.classList.toggle("is-active", isActive);
    filterButton.setAttribute("aria-pressed", String(isActive));
  });
  renderProducts();
});

searchInput.addEventListener("input", renderProducts);

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  const product = products.find((entry) => entry.id === button.dataset.add);
  cart.set(product.id, (cart.get(product.id) || 0) + 1);
  renderCart();
  showToast(`${product.name} added to your bag`);
});

document.querySelector("#cart-items").addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) {
    const id = quantityButton.dataset.quantity;
    const nextQuantity = (cart.get(id) || 0) + Number(quantityButton.dataset.change);
    if (nextQuantity > 0) cart.set(id, nextQuantity);
    else cart.delete(id);
    renderCart();
  }
  if (removeButton) {
    cart.delete(removeButton.dataset.remove);
    renderCart();
  }
});

document.querySelector("#cart-open").addEventListener("click", () => setCartOpen(true));
document.querySelector("#cart-close").addEventListener("click", () => setCartOpen(false));
document.querySelector("#keep-looking").addEventListener("click", () => setCartOpen(false));
document.querySelector("#drawer-backdrop").addEventListener("click", () => setCartOpen(false));
document.querySelector("#checkout-button").addEventListener("click", () => {
  showToast("Demo only — connect a payment service to accept orders.");
});
document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#form-message").textContent = "Thanks for stopping by — the mailing list is a demo for now.";
  event.currentTarget.reset();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.querySelector("#cart-drawer").classList.contains("is-open")) {
    setCartOpen(false);
  }
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
renderProducts();
renderCart();
