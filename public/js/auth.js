document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("authForm");
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const mode = form.dataset.authForm;

    try {
      submitButton.disabled = true;
      await FreshMart.request(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      window.location.href = "/dashboard";
    } catch (error) {
      FreshMart.showAlert(error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
