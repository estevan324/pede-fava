const loginPath = "/pages/login.html";

firebase.auth().onAuthStateChanged((user) => {
  if (!user && window.location.pathname !== loginPath) {
    window.location.href = loginPath;
  } else {
    console.log(user);
    let boasVindas = document.getElementById("boas-vindas");
    boasVindas.textContent = `Seja bem vindo ${user.displayName}!`;
  }
});
