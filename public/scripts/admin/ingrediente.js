document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();

  const formIngrediente = document.getElementById("formIngrediente");
  const nomeInput = document.getElementById("nome");
  const unidadeMedidaSelect = document.getElementById("unidadeMedida");
  const estoqueAtualInput = document.getElementById("estoqueAtual");

  const btnSalvarIngrediente = document.getElementById("btnSalvarIngrediente");

  const tabelaIngredientesBody = document.getElementById("tabelaIngredientes");
  const totalIngredientesSpan = document.getElementById("totalIngredientes");

  const estoqueBaixo = document.getElementById("contadorBaixo");
  const estoqueNormal = document.getElementById("contadorNormal");
  const estoqueZerado = document.getElementById("contadorZerado");

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

        const batch = db.batch(); // Usar um batch para exclusões múltiplas
        movimentacoesSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        const ingredienteRef = db.collection("ingredientes").doc(ingredienteId);
        batch.delete(ingredienteRef);

        await batch.commit();

        alert(
          "Ingrediente e suas movimentações de estoque foram excluídos com sucesso!"
        );
        await getAndDisplayIngredientes(); // Atualizar a tabela após a exclusão
      } catch (error) {
        console.error("Erro ao excluir ingrediente:", error);
        alert(
          "Erro ao excluir o ingrediente. Verifique o console para mais detalhes."
        );
      }
    }
  }

  async function getAndDisplayIngredientes() {
    try {
      const allMovimentacoesSnapshot = await db
        .collection("movimentacoesEstoque")
        .get();
      const movimentacoesPorIngrediente = new Map();

      allMovimentacoesSnapshot.forEach((movDoc) => {
        const data = movDoc.data();
        const ingredienteId = data.ingredienteId;
        if (ingredienteId) {
          if (!movimentacoesPorIngrediente.has(ingredienteId)) {
            movimentacoesPorIngrediente.set(ingredienteId, []);
          }
          movimentacoesPorIngrediente.get(ingredienteId).push(data);
        }
      });

      const ingredienteSnapshot = await db.collection("ingredientes").get();
      const ingredientes = [];

      let quantidadeStatusEstoque = {
        zerado: 0,
        baixo: 0,
        normal: 0,
      };

      for (const ingredienteDoc of ingredienteSnapshot.docs) {
        const data = ingredienteDoc.data();
        const ingredienteId = ingredienteDoc.id;

        const movimentacoesDoIngrediente =
          movimentacoesPorIngrediente.get(ingredienteId) || [];

        movimentacoesDoIngrediente.sort(
          (a, b) => (b.dataMovimentacao || 0) - (a.dataMovimentacao || 0)
        );

        let estoque =
          movimentacoesDoIngrediente.length > 0
            ? movimentacoesDoIngrediente[0].estoqueAtual
            : 0;

        let statusEstoque = "";
        let statusClass = "";

        if (estoque === 0) {
          statusEstoque = "Zerado";
          statusClass = "text-danger fw-bold";
          quantidadeStatusEstoque.zerado++;
        } else if (estoque > 0 && estoque <= 5) {
          statusEstoque = "Baixo";
          statusClass = "text-warning fw-medium";
          quantidadeStatusEstoque.baixo++;
        } else {
          statusEstoque = "Normal";
          statusClass = "text-success";
          quantidadeStatusEstoque.normal++;
        }

        ingredientes.push({
          id: ingredienteId,
          nome: data.nome,
          unidadeMedida: data.unidadeMedida,
          estoqueAtual: estoque,
          status: statusEstoque,
          statusClass: statusClass,
          timestamp: data.timestamp || null,
        });

        estoqueZerado.textContent = quantidadeStatusEstoque.zerado;
        estoqueNormal.textContent = quantidadeStatusEstoque.normal;
        estoqueBaixo.textContent = quantidadeStatusEstoque.baixo;
      }

      tabelaIngredientesBody.innerHTML = "";
      totalIngredientesSpan.innerHTML = `${ingredientes.length} ingredientes`;

      if (ingredientes.length > 0) {
        ingredientes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        ingredientes.forEach((ingrediente) => {
          const row = tabelaIngredientesBody.insertRow();
          row.insertCell(0).textContent = ingrediente.nome;
          row.insertCell(1).textContent = ingrediente.unidadeMedida;
          row.insertCell(2).textContent = ingrediente.estoqueAtual;
          row.insertCell(
            3
          ).innerHTML = `<span class="${ingrediente.statusClass}">${ingrediente.status}</span>`;

          const actionsCell = row.insertCell(4);
          actionsCell.innerHTML = `
            <button class="btn btn-sm btn-info me-2">Editar</button>
            <button class="btn btn-sm btn-danger btn-excluir" data-id="${ingrediente.id}">Excluir</button>
          `;

          actionsCell
            .querySelector(".btn-excluir")
            .addEventListener("click", () => {
              deleteIngrediente(ingrediente.id);
            });
        });
      } else {
        tabelaIngredientesBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        Nenhum ingrediente cadastrado ainda.
                        <br>
                        <a href="cadastro_ingredientes.html" class="btn btn-primary btn-sm mt-2">
                            Cadastrar Primeiro Ingrediente
                        </a>
                    </td>
                </tr>
            `;
      }
    } catch (error) {
      console.error("Erro ao obter ingredientes:", error);
      alert("Erro ao carregar ingredientes. Verifique o console.");
    }
  }

  await getAndDisplayIngredientes();

  btnSalvarIngrediente.addEventListener("click", async (event) => {
    event.preventDefault();

    if (!formIngrediente.checkValidity()) {
      formIngrediente.classList.add("was-validated");
      return;
    }

    const nome = nomeInput.value;
    const unidadeMedida = unidadeMedidaSelect.value;

    if (!nome || !unidadeMedida) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const ingredienteRef = await db.collection("ingredientes").add({
        nome: nome,
        unidadeMedida: unidadeMedida,
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

      alert("Ingrediente salvo com sucesso!");

      formIngrediente.reset();
      formIngrediente.classList.remove("was-validated");
      const modalElement = document.getElementById("cadastrarIngrediente");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }

      await getAndDisplayIngredientes();
    } catch (e) {
      console.error("Erro ao adicionar documento: ", e);
      alert(
        "Erro ao salvar o ingrediente. Verifique o console para mais detalhes."
      );
    }
  });
});
