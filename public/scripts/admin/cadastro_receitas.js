document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();

  var ingredientes = await pegarIngredientes();
  // var estoque = await pegarEstoque();
  const selectIngredientes = document.getElementById("ingredienteSelecionado");

  const unidadeIngredienteInput = document.getElementById("unidadeIngrediente");
  const ingredienteSelecionadoSelect = document.getElementById(
    "ingredienteSelecionado"
  );

  document
    .getElementById("formReceita")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);

      const receita = {};
      formData.forEach((value, key) => {
        receita[key] = value;
      });

      const ingredientes = [];
      const tbody = document.getElementById("listaIngredientesReceita");

      tbody.querySelectorAll("tr").forEach((tr) => {
        if (tr.id === "semIngredientes") return;

        const tds = tr.querySelectorAll("td");

        ingredientes.push({
          nome: tds[0].textContent.trim(),
          quantidade: parseFloat(tds[1].textContent.trim()),
          unidade: tds[2].textContent.trim(),
        });
      });

      receita.ingredientes = ingredientes;

      let resultado = await salvarReceita(receita);
      if (resultado) {
        window.alert("Receita salva com sucesso!");
        window.location.href = "/admin/receitas.html";
      }
    });

  document
    .getElementById("adicionarIngrediente")
    .addEventListener("click", () => {
      const select = document.getElementById("ingredienteSelecionado");
      const nome = select.options[select.selectedIndex].text;
      const id = select.value;
      const quantidade = parseFloat(
        document.getElementById("quantidadeIngrediente").value
      );
      const unidade = document.getElementById("unidadeIngrediente").value;

      if (!id || isNaN(quantidade) || quantidade <= 0) {
        alert("Preencha corretamente o ingrediente e a quantidade.");
        return;
      }

      const tbody = document.getElementById("listaIngredientesReceita");

      const linhaPlaceholder = document.getElementById("semIngredientes");
      if (linhaPlaceholder) linhaPlaceholder.remove();

      const tr = document.createElement("tr");
      tr.innerHTML = `
    <td>${nome}</td>
    <td>${quantidade}</td>
    <td>${unidade}</td>
    <td>
      <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('tr').remove()">Remover</button>
    </td>
  `;

      tbody.appendChild(tr);

      select.value = "";
      document.getElementById("quantidadeIngrediente").value = "";
      document.getElementById("unidadeIngrediente").value = "";
    });

  ingredientes.forEach((ingrediente) => {
    const option = document.createElement("option");
    option.value = ingrediente.id;
    option.textContent = ingrediente.nome;
    selectIngredientes.appendChild(option);
  });

  async function pegarIngredientes() {
    const querySnapshot = await db.collection("ingredientes").get();
    var ingredientes = [];
    querySnapshot.forEach((doc) => {
      let temp = {
        id: doc.id,
        ...doc.data(),
      };
      ingredientes.push(temp);
    });
    return ingredientes;
  }

  ingredienteSelecionadoSelect.addEventListener("change", (e) => {
    const ingrediente = ingredientes.find((i) => i.id === e.target.value);

    unidadeIngredienteInput.value = ingrediente.unidadeMedida;
  });

  async function pegarEstoque() {
    const querySnapshot = await db.collection("movimentacoesEstoque").get();
    var estoque = [];
    querySnapshot.forEach((doc) => {
      let temp = {
        id: doc.id,
        ...doc.data(),
      };
      estoque.push(temp);
    });
    return estoque;
  }

  async function salvarReceita(data) {
    try {
      const docRef = await firebase
        .firestore()
        .collection("receitas")
        .add(data);
      console.log("Documento escrito com ID:", docRef.id);
      return true;
    } catch (e) {
      console.error("Erro ao adicionar documento:", e);
      alert("Erro ao salvar receita. Tente novamente.");
      return false;
    }
  }
});
