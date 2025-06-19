const isRoot = window.location.pathname === "/" || window.location.pathname.endsWith("index.html");
const prefix = isRoot ? "" : "../";

fetch(`${prefix}components/navbar.html`)
  .then((res) => res.text())
  .then((html) => {
    const el = document.getElementById("navbar");
    if (el) el.innerHTML = html;
  });

fetch(`${prefix}components/navbar-admin.html`)
  .then((res) => res.text())
  .then((html) => {
    const el = document.getElementById("navbar-admin");
    if (el) el.innerHTML = html;
  });

fetch(`${prefix}components/footer.html`)
  .then((res) => res.text())
  .then((html) => {
    const el = document.getElementById("footer");
    if (el) el.innerHTML = html;
  });

function navigate(page) {
  window.location.href = page;
}
