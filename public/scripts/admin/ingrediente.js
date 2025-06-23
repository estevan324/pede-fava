import { getEstoqueIngrediente } from "../common.js";

document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();

  const formIngrediente = document.getElementById("formIngrediente");
  const nomeInput = document.getElementById("nome");
  const unidadeMedidaSelect = document.getElementById("unidadeMedida");
  const estoqueAtualInput = document.getElementById("estoqueAtual");
  const estoqueMinimoInput = document.getElementById("estoqueMinimo");

  const btnSalvarIngrediente = document.getElementById("btnSalvarIngrediente");

  const tabelaIngredientesBody = document.getElementById("tabelaIngredientes");
  const totalIngredientesSpan = document.getElementById("totalIngredientes");

  const estoqueBaixo = document.getElementById("contadorBaixo");
  const estoqueNormal = document.getElementById("contadorNormal");
  const estoqueZerado = document.getElementById("contadorZerado");

  const tituloFormulario = document.getElementById("tituloFormulario");

  let ingredientes = [];
  let ingredienteAtual = null;

  async function deleteIngrediente(ingredienteId) {
    if (
      confirm(
        "Tem certeza que deseja excluir este ingrediente? Todas as movimentações de estoque associadas também serão removidas."
      )
    ) {
      try {
        const movimentacoesSnapshot = await db
          .collection("movimentacoesEstoque")
          .where("ingredienteId", "==", ingredienteId)
          .get();

        const batch = db.batch();
        movimentacoesSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        const ingredienteRef = db.collection("ingredientes").doc(ingredienteId);
        batch.delete(ingredienteRef);

        await batch.commit();

        alert(
          "Ingrediente e suas movimentações de estoque foram excluídos com sucesso!"
        );

        await getEstoqueIngrediente(db).then((result) => {
          ingredientes = result;
          displayIngredientes(result);
        });
      } catch (error) {
        console.error("Erro ao excluir ingrediente:", error);
        alert(
          "Erro ao excluir o ingrediente. Verifique o console para mais detalhes."
        );
      }
    }
  }

  const componentEstoqueInicial = document.getElementById(
    "componentEstoqueInicial"
  );
  async function openModalEdit(id) {
    formIngrediente.classList.remove("was-validated");
    formIngrediente.reset();

    tituloFormulario.textContent = "Edição de ingrediente";
    ingredienteAtual = ingredientes.find((i) => i.id === id);

    nomeInput.value = ingredienteAtual?.nome || "";
    unidadeMedidaSelect.value = ingredienteAtual?.unidadeMedida || "";
    estoqueMinimoInput.value = ingredienteAtual?.estoqueMinimo || "";
    estoqueAtualInput.removeAttribute("required");
    componentEstoqueInicial.classList.add("d-none");

    const modalElement = document.getElementById("cadastrarIngrediente");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

  document.getElementById("openModalCadastro").addEventListener("click", () => {
    tituloFormulario.textContent = "Cadastro de ingrediente";
    ingredienteAtual = null;
    componentEstoqueInicial.classList.remove("d-none");

    formIngrediente.classList.remove("was-validated");
    formIngrediente.reset();
  });

  function displayIngredientes(ingredientesParaExibir) {
    try {
      let quantidadeStatusEstoque = {
        zerado: 0,
        baixo: 0,
        normal: 0,
      };

      for (let ingrediente of ingredientesParaExibir) {
        let statusEstoque = "";
        let statusClass = "";

        const estoqueMinimo = ingrediente?.estoqueMinimo || 5;
        const estoque = ingrediente.estoqueAtual;

        if (estoque === 0) {
          statusEstoque = "Zerado";
          statusClass = "text-danger fw-bold";
          quantidadeStatusEstoque.zerado++;
        } else if (estoque > 0 && estoque < estoqueMinimo) {
          statusEstoque = "Baixo";
          statusClass = "text-warning fw-medium";
          quantidadeStatusEstoque.baixo++;
        } else {
          statusEstoque = "Normal";
          statusClass = "text-success";
          quantidadeStatusEstoque.normal++;
        }

        ingrediente.status = statusEstoque;
        ingrediente.statusClass = statusClass;
      }

      estoqueBaixo.textContent = quantidadeStatusEstoque.baixo;
      estoqueNormal.textContent = quantidadeStatusEstoque.normal;
      estoqueZerado.textContent = quantidadeStatusEstoque.zerado;

      tabelaIngredientesBody.innerHTML = "";
      totalIngredientesSpan.innerHTML = `${ingredientesParaExibir.length} ingredientes`;

      if (ingredientesParaExibir.length > 0) {
        ingredientesParaExibir.sort(
          (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
        );

        ingredientesParaExibir.forEach((ingrediente) => {
          const row = tabelaIngredientesBody.insertRow();
          row.insertCell(0).textContent = ingrediente.nome;
          row.insertCell(1).textContent = ingrediente.unidadeMedida;
          row.insertCell(2).textContent = ingrediente.estoqueAtual;
          row.insertCell(3).textContent = ingrediente.estoqueMinimo;
          row.insertCell(
            4
          ).innerHTML = `<span class="${ingrediente.statusClass}">${ingrediente.status}</span>`;

          const actionsCell = row.insertCell(5);
          actionsCell.innerHTML = `
            <button class="btn btn-sm btn-warning me-2 btn-editar" data-id="${ingrediente.id}">Editar</button>
            <button class="btn btn-sm btn-danger btn-excluir" data-id="${ingrediente.id}">Excluir</button>
          `;

          actionsCell
            .querySelector(".btn-excluir")
            .addEventListener("click", () => {
              deleteIngrediente(ingrediente.id);
            });

          actionsCell
            .querySelector(".btn-editar")
            .addEventListener("click", () => {
              openModalEdit(ingrediente.id);
            });
        });
      } else {
        tabelaIngredientesBody.innerHTML = `
                <tr>
                  <td colspan="6" class="text-center text-muted">
                    Nenhum ingrediente cadastrado
                  </td>
                </tr>
            `;
      }
    } catch (error) {
      console.error("Erro ao obter ingredientes:", error);
      alert("Erro ao carregar ingredientes. Verifique o console.");
    }
  }

  getEstoqueIngrediente(db).then((result) => {
    ingredientes = result;
    displayIngredientes(result);
  });

  btnSalvarIngrediente.addEventListener("click", async (event) => {
    event.preventDefault();

    if (!formIngrediente.checkValidity()) {
      formIngrediente.classList.add("was-validated");
      return;
    }

    const nome = nomeInput.value;
    const unidadeMedida = unidadeMedidaSelect.value;
    const estoqueMinimo = estoqueMinimoInput.value;

    if (!nome || !unidadeMedida || !estoqueMinimo) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      let ingredienteRef;
      if (ingredienteAtual) {
        ingredienteRef = db.collection("ingredientes").doc(ingredienteAtual.id);

        await ingredienteRef.update({
          nome,
          unidadeMedida,
          estoqueMinimo,
        });
      } else {
        ingredienteRef = await db.collection("ingredientes").add({
          nome,
          unidadeMedida,
          estoqueMinimo,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        db.collection("movimentacoesEstoque").add({
          ingredienteId: ingredienteRef.id,
          quantidade: parseFloat(estoqueAtualInput.value),
          dataMovimentacao: firebase.firestore.FieldValue.serverTimestamp(),
          tipo: "entrada",
          motivo: "-",
          estoqueAnterior: 0,
          estoqueAtual: parseFloat(estoqueAtualInput.value),
        });
      }

      alert("Ingrediente salvo com sucesso!");

      formIngrediente.reset();
      formIngrediente.classList.remove("was-validated");
      const modalElement = document.getElementById("cadastrarIngrediente");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }

      getEstoqueIngrediente(db).then((result) => {
        ingredientes = result;
        displayIngredientes(result);
      });
    } catch (e) {
      console.error("Erro ao salvar documento: ", e);
      alert(
        "Erro ao salvar o ingrediente. Verifique o console para mais detalhes."
      );
    }
  });

  const filtroNomeInput = document.getElementById("filtroNome");
  const filtroStatusSelect = document.getElementById("filtroStatus");
  const handleFiltroChange = async () => {
    console.log(ingredientes);
    const filtros = {
      nome: filtroNomeInput.value,
      status: filtroStatusSelect.value,
    };

    const ingredientesFiltrados = ingredientes.filter((ingrediente) => {
      const termoNome = filtros.nome ? filtros.nome.trim().toLowerCase() : "";
      const termoStatus = filtros.status;

      const matchNome = termoNome
        ? ingrediente.nome.toLowerCase().includes(termoNome)
        : true;
      const matchStatus = termoStatus
        ? ingrediente.status.toLowerCase() === termoStatus
        : true;

      return matchNome && matchStatus;
    });

    displayIngredientes(ingredientesFiltrados);
  };

  filtroNomeInput.addEventListener("input", handleFiltroChange);
  filtroStatusSelect.addEventListener("change", handleFiltroChange);

  document.getElementById("btnLimparFiltros").addEventListener("click", () => {
    displayIngredientes(ingredientes);
  });

  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      localStorage.setItem("backPage", "/admin/ingredientes.html");
      window.location.href = "/pages/login.html";
    }
  });
});
