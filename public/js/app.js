const FreshMart = {
  async request(url, options = {}) {
    const settings = {
      headers: {},
      ...options
    };

    if (settings.body && !settings.headers["Content-Type"]) {
      settings.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, settings);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      throw new Error(payload?.message || "Не удалось выполнить запрос.");
    }

    return payload;
  },

  showAlert(message, type = "success") {
    const alertContainer = document.getElementById("globalAlert");
    if (!alertContainer) {
      window.alert(message);
      return;
    }

    const alert = document.createElement("div");
    alert.className = `alert ${type}`;
    alert.textContent = message;
    alertContainer.innerHTML = "";
    alertContainer.appendChild(alert);

    window.clearTimeout(FreshMart.alertTimeout);
    FreshMart.alertTimeout = window.setTimeout(() => {
      alert.remove();
    }, 3500);
  },

  formatCurrency(value) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  },

  formatDate(value) {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  },

  createEmptyRow(message, colSpan) {
    return `<tr><td colspan="${colSpan}"><div class="empty-state">${message}</div></td></tr>`;
  }
};

document.addEventListener("click", async (event) => {
  const logoutButton = event.target.closest('[data-action="logout"]');
  if (!logoutButton) {
    return;
  }

  try {
    logoutButton.disabled = true;
    await FreshMart.request("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  } catch (error) {
    logoutButton.disabled = false;
    FreshMart.showAlert(error.message, "error");
  }
});
