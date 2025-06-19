document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "/pages/login.html";
    }
  });
});
