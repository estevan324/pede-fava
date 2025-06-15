fetch("../components/navbar.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("header").innerHTML = html;
  });

fetch("../components/footer.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("footer").innerHTML = html;
  });
