var authEmailPassButton = document.getElementById("authEmailPassButton");
var authGoogleButton = document.getElementById("authGoogleButton");
//var authAnonymouslyButton = document.getElementById('authAnonymouslyButton');
var createUserButton = document.getElementById("createUserButton");
var logOutButton = document.getElementById("logOutButton");

// Inputs
var emailInput = document.getElementById("emailInput");
var passwordInput = document.getElementById("passwordInput");

// Displays
var displayName = document.getElementById("displayName");

// Criar novo usuário
createUserButton.addEventListener("click", function () {
  firebase
    .auth()
    .createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
    .then(() => {
      window.location.href = "/";
    })
    .catch(function (error) {
      console.error(error.code);
      console.error(error.message);
      alert("Falha ao cadastrar, verifique o erro no console.");
    });
});

// Autenticar com E-mail e Senha
authEmailPassButton.addEventListener("click", function () {
  firebase
    .auth()
    .signInWithEmailAndPassword(emailInput.value, passwordInput.value)
    .then(() => {
      window.location.href = "/";
    })
    .catch(function (error) {
      console.error(error.code);
      console.error(error.message);
      alert(error.message);
    });
});

// Autenticar com Google
authGoogleButton.addEventListener("click", function () {
  // Providers
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase
    .auth()
    .signInWithPopup(provider)
    .then(() => {
      window.location.href = "/";
    })
    .catch(function (error) {
      console.log(error);
      alert("Falha na autenticação");
    });
});
