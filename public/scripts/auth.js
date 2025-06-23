var authEmailPassButton = document.getElementById("authEmailPassButton");
var authGoogleButton = document.getElementById("authGoogleButton");
var createUserButton = document.getElementById("createUserButton");

var emailInput = document.getElementById("emailInput");
var passwordInput = document.getElementById("passwordInput");

var displayName = document.getElementById("displayName");
var feedbackMessage = document.getElementById("feedbackMessage");

function showFeedback(message, type) {
  feedbackMessage.textContent = message;

  feedbackMessage.classList.remove(
    "alert-success",
    "alert-danger",
    "alert-warning",
    "alert-info",
    "d-none",
    "d-block"
  );

  feedbackMessage.classList.add(`alert-${type}`, "d-block");

  setTimeout(() => {
    feedbackMessage.classList.remove("d-block");
    feedbackMessage.classList.add("d-none");
    feedbackMessage.textContent = "";
  }, 5000);
}

createUserButton.addEventListener("click", function () {
  if (!emailInput.value || !passwordInput.value) {
    showFeedback("Por favor, preencha o e-mail e a senha.", "warning");
    return;
  }

  firebase
    .auth()
    .createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
    .then(() => {
      showFeedback(
        "Conta criada com sucesso! Você já está logado(a).",
        "success"
      );
      backToPage();
    })
    .catch(function (error) {
      console.error("Erro de criação de usuário:", error.code, error.message); // Log mais descritivo
      let errorMessage = "Falha ao cadastrar: ";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage += "Este e-mail já está em uso.";
          break;
        case "auth/invalid-email":
          errorMessage += "Formato de e-mail inválido.";
          break;
        case "auth/weak-password":
          errorMessage += "A senha deve ter pelo menos 6 caracteres.";
          break;
        default:
          errorMessage += "Um erro inesperado ocorreu. Tente novamente."; // Mensagem genérica mais útil
          break;
      }
      showFeedback(errorMessage, "danger");
    });
});

authEmailPassButton.addEventListener("click", function (event) {
  event.preventDefault();

  if (!emailInput.value || !passwordInput.value) {
    showFeedback("Por favor, preencha o e-mail e a senha.", "warning");
    return;
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(emailInput.value, passwordInput.value)
    .then(() => {
      showFeedback("Login realizado com sucesso!", "success");
      backToPage();
    })
    .catch(function (error) {
      console.error("Erro de login:", error.code, error.message); // Log mais descritivo
      let errorMessage = "Falha no login: ";
      switch (error.code) {
        case "auth/invalid-credential": // Novo erro comum do Firebase para credenciais inválidas (a partir de versões mais recentes)
        case "auth/invalid-email":
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage += "E-mail ou senha inválidos.";
          break;
        case "auth/user-disabled":
          errorMessage += "Sua conta foi desativada.";
          break;
        default:
          errorMessage += "Ocorreu um erro inesperado. Tente novamente.";
          break;
      }
      showFeedback(errorMessage, "danger");
    });
});

authGoogleButton.addEventListener("click", function () {
  // Providers
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase
    .auth()
    .signInWithPopup(provider)
    .then(() => {
      showFeedback("Login com Google realizado com sucesso!", "success");
      backToPage();
    })
    .catch(function (error) {
      console.error("Erro de autenticação Google:", error.code, error.message); // Log mais descritivo
      let errorMessage = "Falha na autenticação com Google: ";
      // firebase.auth.Auth.is (FirebaseError).code
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage += "A janela de login do Google foi fechada.";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage += "A requisição pop-up foi cancelada.";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage +=
          "Login com Google não está habilitado no seu projeto Firebase.";
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        errorMessage +=
          "Uma conta com este e-mail já existe, mas foi criada com outro método de login (ex: e-mail/senha). Tente o login com o método original.";
      } else {
        errorMessage += "Ocorreu um erro inesperado.";
      }
      showFeedback(errorMessage, "danger");
    });
});

function backToPage() {
  let backPage = localStorage.getItem("backPage");
  if (backPage !== null) {
    localStorage.removeItem("backPage");
    window.location.href = backPage;
  } else {
    window.location.href = "/";
  }
}

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    console.log("Usuário logado:", user.email);
  } else {
    console.log("Nenhum usuário logado.");
  }
});
