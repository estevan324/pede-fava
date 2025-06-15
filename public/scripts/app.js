firebase.auth().onAuthStateChanged((user) => {
  const loginNav = document.getElementById("login");
  const welcomeNav = document.getElementById("boas-vindas");

  if (user) {
    welcomeNav.classList.remove("d-none");
    welcomeNav.classList.add("d-block");
  } else {
    loginNav.classList.remove("d-none");
    loginNav.classList.add("d-block");
  }

  // Ocultar valores sensíveis sem login
  const sensitiveValues = document.querySelectorAll("#sensitive-value");
  if (!user) {
    sensitiveValues.forEach((value) => {
      value.textContent = "-";
    });
  }
});
