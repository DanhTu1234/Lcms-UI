function loadComponent(element, filePath) {
  axios.get(filePath)
    .then(response => {
      document.getElementById(element).innerHTML = response.data;

      // Nếu load header thì xử lý active
      if (element === "header") {
        setActiveNav();
      }
    })
    .catch(error => {
      console.error(`Lỗi khi tải:`, error);
    });
}

// Hàm tự động đánh dấu active cho menu
function setActiveNav() {
  const currentPath = window.location.pathname.split("/").pop(); 
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

  navLinks.forEach(link => {
    const linkPath = link.getAttribute("href").split("/").pop();

    if (linkPath === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Khi trang được load xong thì chèn header & footer
document.addEventListener("DOMContentLoaded", () => {
  loadComponent("header", "./components/header.html");
  loadComponent("footer", "./components/footer.html");
});
