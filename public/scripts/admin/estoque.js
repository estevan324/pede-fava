document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();

  const tabelaMovimentacoes = document.getElementById("historicoMovimentacoes");

  async function getAndDisplayEstoque() {
    const allMovimentacoesSnapshot = await db
      .collection("movimentacoesEstoque")
      .get();

    const allIngredientesSnapshot = await db.collection("ingredientes").get();
    const ingredientes = allIngredientesSnapshot.docs.map((ingrediente) => {
      const i = ingrediente.data();

      return {
        id: ingrediente.id,
        nome: i.nome,
      };
    });

    const movimentacoes = [];
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
});
