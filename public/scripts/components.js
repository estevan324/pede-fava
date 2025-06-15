fetch("../components/navbar.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("navbar").innerHTML = html;
  });

fetch("../components/navbar-admin.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("navbar-admin").innerHTML = html;
  });

fetch("../components/footer.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("footer").innerHTML = html;
  });

function navigate(page) {
  window.location.href = page;
}
