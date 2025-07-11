document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();

  const tabelaMovimentacoes = document.getElementById("historicoMovimentacoes");
  const btnRegistrarMovimentacao = document.getElementById(
    "btnRegistrarMovimentacao"
  );
  const formMovimentacaoEstoque = document.getElementById(
    "formMovimentacaoEstoque"
  );

  const ingredientesSelect = document.getElementById("ingredienteMovimentacao");

  let movimentacoes = [];
  let ingredientes = [];

  async function getEstoque() {
    movimentacoes = [];
    ingredientes = [];

    const allMovimentacoesSnapshot = await db
      .collection("movimentacoesEstoque")
      .get();

    const allIngredientesSnapshot = await db.collection("ingredientes").get();
    allIngredientesSnapshot.docs.forEach((ingrediente) => {
      const i = ingrediente.data();

      const option = document.createElement("option");
      option.value = ingrediente.id;
      option.label = i.nome;

      ingredientesSelect.add(option);

      ingredientes.push({
        id: ingrediente.id,
        ...i,
      });
    });

    for (const ingrediente of ingredientes) {
      let option = document.createElement("option");

      option.label = ingrediente.nome;
      option.value = ingrediente.id;

      filtroIngredienteSelect.add(option);
    }

    for (const movimentacaoDoc of allMovimentacoesSnapshot.docs) {
      const data = movimentacaoDoc.data();

      const quantidade = parseInt(data.quantidade);

      let tipoClass;

      switch (data.tipo) {
        case "entrada":
          tipoClass = "bg-success";
          break;
        case "saida":
          tipoClass = "bg-danger";
          break;
        default:
          tipoClass = "bg-warning";
      }

      const ingrediente = ingredientes.find((i) => i.id === data.ingredienteId);
      movimentacoes.push({
        timestamp: data.dataMovimentacao,
        estoqueAnterior: data.estoqueAnterior,
        estoqueAtual: data.estoqueAtual,
        motivo: data.motivo,
        quantidade: quantidade < 0 ? quantidade * -1 : quantidade,
        tipo: data.tipo,
        tipoClass: tipoClass,
        ingrediente: ingrediente.nome,
        ingredienteId: ingrediente.id,
      });
    }
  }

  function displayEstoque(movimentacoesParaExibir) {
    tabelaMovimentacoes.innerHTML = "";

    if (movimentacoesParaExibir.length > 0) {
      movimentacoesParaExibir.sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
      );

      movimentacoesParaExibir.forEach((movimentacao) => {
        const row = tabelaMovimentacoes.insertRow();
        row.insertCell(0).textContent = new Date(
          movimentacao.timestamp.seconds * 1000
        ).toLocaleString();
        row.insertCell(1).textContent = movimentacao.ingrediente;
        row.insertCell(
          2
        ).innerHTML = `<span class="badge ${movimentacao.tipoClass}">${movimentacao.tipo}</span>`;
        row.insertCell(3).textContent = movimentacao.quantidade;
        row.insertCell(4).textContent = movimentacao.motivo;
        row.insertCell(5).textContent = movimentacao.estoqueAnterior;
        row.insertCell(6).textContent = movimentacao.estoqueAtual;
      });
    } else {
      tabelaMovimentacoes.innerHTML = `
                <tr>
                  <td colspan="7" class="text-center text-muted">
                    Nenhuma movimentação registrada
                  </td>
                </tr>
            `;
    }
  }

  getEstoque().then(() => displayEstoque(movimentacoes));

  ingredientesSelect.addEventListener("change", (e) => {
    const ingrediente = ingredientes.find((i) => i.id === e.target.value);

    const unidadeMovimentacaoInput = document.getElementById(
      "unidadeMovimentacao"
    );

    unidadeMovimentacaoInput.value = ingrediente.unidadeMedida;
  });

  btnRegistrarMovimentacao.addEventListener("click", async (event) => {
    event.preventDefault();

    if (!formMovimentacaoEstoque.checkValidity()) {
      formMovimentacaoEstoque.classList.add("was-validated");
      return;
    }

    const ultimaMovimentacao = movimentacoes.find(
      (m) => m.ingredienteId === ingredientesSelect.value
    );

    const estoqueAtual = ultimaMovimentacao?.estoqueAtual || 0;
    const tipoMovimentacaoInput = document.getElementById("tipoMovimentacao");
    const motivoInput = document.getElementById("motivoMovimentacao");
    const quantidadeInput = document.getElementById("quantidadeMovimentacao");

    let quantidadeNova = 0;

    switch (tipoMovimentacaoInput.value) {
      case "saida":
        quantidadeNova = estoqueAtual - parseFloat(quantidadeInput.value);
        break;
      case "entrada":
        quantidadeNova = estoqueAtual + parseFloat(quantidadeInput.value);
        break;
      default:
        quantidadeNova = parseFloat(quantidadeInput.value);
    }

    try {
      await db.collection("movimentacoesEstoque").add({
        ingredienteId: ingredientesSelect.value,
        quantidade: quantidadeInput.value,
        dataMovimentacao: firebase.firestore.FieldValue.serverTimestamp(),
        tipo: tipoMovimentacaoInput.value,
        motivo: motivoInput.value,
        estoqueAnterior: estoqueAtual,
        estoqueAtual: quantidadeNova,
      });

      alert("Movimentação salva com sucesso!");

      formMovimentacaoEstoque.reset();
      formMovimentacaoEstoque.classList.remove("was-validated");
      const modalElement = document.getElementById("modalMovimentacaoEstoque");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }

      getEstoque().then(() => displayEstoque(movimentacoes));
    } catch (e) {
      console.error("Erro ao adicionar documento: ", e);
      alert(
        "Erro ao salvar a movimentação. Verifique o console para mais detalhes."
      );
    }
  });

  const filtroIngredienteSelect = document.getElementById("filtroIngrediente");
  const filtroTipoMovimentacaoSelect = document.getElementById("filtroTipo");
  const filtroDataInicio = document.getElementById("filtroDataInicio");
  const filtroDataFim = document.getElementById("filtroDataFim");

  const handleFiltroChange = () => {
    const filtros = {
      ingrediente: filtroIngredienteSelect.value,
      tipo: filtroTipoMovimentacaoSelect.value,
      periodo: {
        dataInicio: filtroDataInicio.value,
        dataFim: filtroDataFim.value,
      },
    };

    const estoque = movimentacoes.filter((movimentacao) => {
      console.log(movimentacao);

      if (!movimentacao.timestamp || !movimentacao.timestamp.toDate) {
        return false;
      }

      const matchIngrediente = filtros.ingrediente
        ? movimentacao.ingredienteId.includes(filtros.ingrediente)
        : true;

      const dataMovimentacao = movimentacao.timestamp.toDate();

      const matchTipo = filtros.tipo
        ? movimentacao.tipo.includes(filtros.tipo)
        : true;

      const matchDataInicio = filtros.periodo.dataInicio
        ? dataMovimentacao >= new Date(filtros.periodo.dataInicio)
        : true;

      const matchDataFim = filtros.periodo.dataFim
        ? (() => {
            const dataFimAjustada = new Date(filtros.periodo.dataFim);
            dataFimAjustada.setHours(23, 59, 59, 999);
            return dataMovimentacao <= dataFimAjustada;
          })()
        : true;

      return matchTipo && matchDataInicio && matchDataFim && matchIngrediente;
    });
    displayEstoque(estoque);
  };

  filtroIngredienteSelect.addEventListener("change", handleFiltroChange);
  filtroTipoMovimentacaoSelect.addEventListener("change", handleFiltroChange);
  filtroDataFim.addEventListener("input", handleFiltroChange);
  filtroDataInicio.addEventListener("input", handleFiltroChange);

  document
    .getElementById("btnLimparFiltrosEstoque")
    .addEventListener("click", () => {
      displayEstoque(movimentacoes);
    });

  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      localStorage.setItem("backPage", "/admin/estoque.html");
      window.location.href = "/pages/login.html";
    }
  });
});
