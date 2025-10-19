function showAlert(message, type = "info") {
  const alertContainer = document.getElementById("alert-container");

  const alert = document.createElement("div");
  alert.className = `alert alert-${type} alert-dismissible fade show mt-2`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alertContainer.appendChild(alert);

  setTimeout(() => alert.remove(), 3000);
}
