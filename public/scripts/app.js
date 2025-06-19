firebase.auth().onAuthStateChanged((user) => {
  const loginNav = document.getElementById("login");
  const adminNav = document.getElementById("admin");

  if (user) {
    loginNav?.classList.add("d-none");
    adminNav?.classList.remove("d-none");
  } else {
    adminNav?.classList.add("d-none");
    loginNav?.classList.remove("d-none");
  }
  // Ocultar valores sensíveis sem login
  const sensitiveValues = document.querySelectorAll("#sensitive-value");
  if (!user) {
    sensitiveValues.forEach((value) => {
      value.textContent = "-";
    });
  }
});
