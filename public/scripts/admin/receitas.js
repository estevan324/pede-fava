document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      localStorage.setItem("backPage", "/admin/receitas.html");
      window.location.href = "/pages/login.html";
    }
  });
});
