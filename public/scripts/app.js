firebase.auth().onAuthStateChanged((user) => {
  const loginNav = document.getElementById("login");
  const welcomeNav = document.getElementById("boas-vindas");

  if (user) {
    welcomeNav.classList.remove("d-none");
    welcomeNav.classList.add("d-block");

    const nomeUsuario = user.displayName.split(" ")[0];
    welcomeNav.children[0].textContent = `Seja bem-vindo ${nomeUsuario}!`;
  } else {
    loginNav.classList.remove("d-none");
    loginNav.classList.add("d-block");
  }
});
