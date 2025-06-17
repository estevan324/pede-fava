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

  async function getAndDisplayEstoque() {
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

    tabelaMovimentacoes.innerHTML = "";

    if (movimentacoes.length > 0) {
      movimentacoes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      movimentacoes.forEach((movimentacao) => {
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

  await getAndDisplayEstoque();

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

      await getAndDisplayEstoque();
    } catch (e) {
      console.error("Erro ao adicionar documento: ", e);
      alert(
        "Erro ao salvar a movimentação. Verifique o console para mais detalhes."
      );
    }
  });
});
