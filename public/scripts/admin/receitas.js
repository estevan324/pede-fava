document.addEventListener("DOMContentLoaded", () => {
  const db = firebase.firestore();
  document.getElementById("btnEditarReceita").addEventListener("click", editarReceita); 
  document.getElementById("btnSalvarAlteracoes").addEventListener("click", salvarEdicaoReceita);

  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      localStorage.setItem("backPage", "/admin/receitas.html");
      window.location.href = "/pages/login.html";
    }
  });

  const inputBuscar = document.getElementById("buscarReceita");
  const selectCategoria = document.getElementById("filtroCategoria");
  const selectOrdenar = document.getElementById("ordenarPor");

  async function exibirReceitasNaTabela(db, filtros = {}) {
    const receitas = await pegarReceitas(db, filtros);

    const tabela = document.getElementById("tabelaReceitas");
    const totalSpan = document.getElementById("totalReceitas");
    const estatisticaTotal = document.getElementById("estatisticaTotal");

    tabela.innerHTML = "";

    if (receitas.length === 0) {
      tabela.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted">
              Nenhuma receita cadastrada ainda.
              <br />
              <a
                href="cadastro-receitas.html"
                class="btn btn-primary btn-sm mt-2"
                aria-label="Cadastrar sua primeira receita"
              >
                Cadastrar Primeira Receita
              </a>
            </td>
        </tr>
      `;
      totalSpan.textContent = "0 receitas";
      estatisticaTotal.textContent = "0";
      return;
    }

    let menorCusto = Infinity;
    let maiorCusto = 0;
    let somaTempo = 0;

    receitas.forEach((receita) => {
      const { id, nomeReceita, categoriaReceita, tempoPreparo, rendimento } =
        receita;

      const custoTotal = receita?.custoTotal || 0;
      const custoPorcao = custoTotal / rendimento;

      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td>${nomeReceita}</td>
        <td>${categoriaReceita}</td>
        <td>${tempoPreparo} min</td>
        <td>${rendimento}</td>
        <td>R$ ${Number(custoTotal).toFixed(2)}</td>
        <td>R$ ${Number(custoPorcao).toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-primary btn-ver-receita" data-id="${id}">Ver</button>
          <button class="btn btn-sm btn-danger btn-excluir" data-id="${id}">Excluir</button>
        </td>
      `;

      tabela.appendChild(linha);

      const custoNum = parseFloat(custoPorcao);
      const tempoNum = parseFloat(tempoPreparo);
      if (custoNum < menorCusto) menorCusto = custoNum;
      if (custoNum > maiorCusto) maiorCusto = custoNum;
      somaTempo += tempoNum;

      linha.querySelector(".btn-ver-receita").addEventListener("click", () => {
        verReceita(id);
      });
    });

    totalSpan.textContent = `${receitas.length} receita${
      receitas.length > 1 ? "s" : ""
    }`;
    estatisticaTotal.textContent = receitas.length;

    document.getElementById(
      "receitaMaisBarata"
    ).textContent = `R$ ${menorCusto.toFixed(2)}`;
    document.getElementById(
      "receitaMaisCara"
    ).textContent = `R$ ${maiorCusto.toFixed(2)}`;
    document.getElementById("tempoMedio").textContent = `${Math.round(
      somaTempo / receitas.length
    )} min`;

    document.querySelectorAll(".btn-excluir").forEach((botao) => {
      botao.addEventListener("click", async () => {
        const id = botao.getAttribute("data-id");
        const confirmado = confirm(
          "Tem certeza que deseja excluir esta receita?"
        );
        if (confirmado) {
          await excluirReceita(id);
          exibirReceitasNaTabela(db, filtros);
        }
      });
    });
  }

  async function pegarReceitas(db, filtros) {
    let query = db.collection("receitas");
    const { nomeBusca, categoriaFiltro, ordenarPor } = filtros;

    if (categoriaFiltro && categoriaFiltro !== "") {
      query = query.where("categoriaReceita", "==", categoriaFiltro);
    }

    if (ordenarPor && ordenarPor !== "") {
      const camposOrdenacao = {
        nome: "nomeReceita",
        categoria: "categoriaReceita",
        tempo: "tempoPreparo",
        custo: "custoTotal",
      };
      if (camposOrdenacao[ordenarPor]) {
        query = query.orderBy(camposOrdenacao[ordenarPor]);
      }
    }

    const snapshot = await query.get();

    let receitas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (nomeBusca && nomeBusca !== "") {
      const termo = nomeBusca.toLowerCase();
      receitas = receitas.filter((r) =>
        r.nomeReceita.toLowerCase().includes(termo)
      );
    }

    return receitas;
  }

  function aplicarFiltros() {
    const filtros = {
      nomeBusca: inputBuscar.value.trim(),
      categoriaFiltro: selectCategoria.value,
      ordenarPor: selectOrdenar.value,
    };
    exibirReceitasNaTabela(db, filtros);
  }

  document
    .getElementById("btnBuscarReceita")
    .addEventListener("click", aplicarFiltros);
  inputBuscar.addEventListener("keyup", (e) => {
    if (e.key === "Enter") aplicarFiltros();
  });
  selectCategoria.addEventListener("change", aplicarFiltros);
  selectOrdenar.addEventListener("change", aplicarFiltros);

  exibirReceitasNaTabela(db, {
    nomeBusca: "",
    categoriaFiltro: "",
    ordenarPor: "nome",
  });

  async function verReceita(id) {
    window.receitaVisualizadaId = id;
    try {
      const doc = await db.collection("receitas").doc(id).get();
      if (!doc.exists) {
        alert("Receita não encontrada!");
        return;
      }
      const receita = doc.data();

      const custoTotal = receita.custoTotal || 0;
      const custoPorcao = custoTotal / receita.rendimento;

      document.getElementById("tituloVisualizarReceita").textContent =
        receita.nomeReceita || "Visualizar Receita";
      document.getElementById("categoriaReceitaDetalhe").textContent =
        receita.categoriaReceita || "-";
      document.getElementById("dificuldadeDetalhe").textContent =
        receita.dificuldade || "-";
      document.getElementById("tempoPreparoDetalhe").textContent =
        receita.tempoPreparo || "-";
      document.getElementById("rendimentoDetalhe").textContent =
        receita.rendimento || "-";
      document.getElementById("custoTotalModal").textContent = `R$ ${Number(
        custoTotal
      ).toFixed(2)}`;
      document.getElementById("custoPorcaoModal").textContent = `R$ ${Number(
        custoPorcao
      ).toFixed(2)}`;
      document.getElementById("observacoesDetalhe").textContent =
        receita.observacoes || "-";

      const tbody = document.getElementById("ingredientesLista");
      tbody.innerHTML = "";

      if (!receita.ingredientes || receita.ingredientes.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center text-muted">Nenhum ingrediente listado.</td>
          </tr>
        `;
      } else {
        receita.ingredientes.forEach((ingrediente) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${ingrediente.nome || "-"}</td>
            <td>${ingrediente.quantidade ?? "-"}</td>
            <td>${ingrediente.unidade || "-"}</td>
          `;
          tbody.appendChild(tr);
        });
      }

      const modoPreparoDiv = document.getElementById("modoPreparoDetalhe");
      modoPreparoDiv.textContent =
        receita.modoPreparo || "Nenhum modo de preparo disponível.";

      const modal = new bootstrap.Modal(
        document.getElementById("modalVisualizarReceita")
      );
      modal.show();
    } catch (error) {
      console.error("Erro ao carregar receita:", error);
      alert("Erro ao carregar a receita.");
    }
  }

  async function salvarEdicaoReceita() {
    const id = document.getElementById("editarReceitaId").value;
    const nomeReceita = document.getElementById("editarNomeReceita").value.trim();
    const descricao = document.getElementById("editarDescricaoReceita").value.trim();
    const tempoPreparo = parseInt(document.getElementById("editarTempoReceita").value);
    const rendimento = parseInt(document.getElementById("editarRendimentoReceita").value);
    const categoriaReceita = document.getElementById("editarCategoriaReceita").value;
    const modoPreparo = document.getElementById("editarModoPreparoReceita").value.trim();

    if (!nomeReceita || !tempoPreparo || !rendimento || !categoriaReceita || !modoPreparo) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await firebase.firestore().collection("receitas").doc(id).update({
        nomeReceita,
        descricao,
        tempoPreparo,
        rendimento,
        categoriaReceita,
        modoPreparo
      });

      const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarReceita"));
      modal.hide();

      alert("Receita atualizada com sucesso.");
      exibirReceitasNaTabela(firebase.firestore());
    } catch (error) {
      console.error("Erro ao salvar edição da receita:", error);
      alert("Erro ao salvar a receita. Tente novamente.");
    }
  }

  async function editarReceita() {
    const receitaId = window.receitaVisualizadaId;
    if (!receitaId) {
      alert("Receita ainda não foi carregada.");
      return;
    }

    try {
      const doc = await firebase.firestore().collection("receitas").doc(receitaId).get();

      if (!doc.exists) {
        alert("Receita não encontrada!");
        return;
      }

      const receita = doc.data();

      document.getElementById("editarReceitaId").value = receitaId;
      document.getElementById("editarNomeReceita").value = receita.nomeReceita || "";
      document.getElementById("editarDescricaoReceita").value = receita.descricao || "";
      document.getElementById("editarTempoReceita").value = receita.tempoPreparo || "";
      document.getElementById("editarRendimentoReceita").value = receita.rendimento || "";
      document.getElementById("editarCategoriaReceita").value = receita.categoriaReceita || "";
      document.getElementById("editarModoPreparoReceita").value = receita.modoPreparo || "";

      const modalEditar = new bootstrap.Modal(document.getElementById("modalEditarReceita"));
      modalEditar.show();
    } catch (error) {
      console.error("Erro ao carregar receita para edição:", error);
      alert("Erro ao carregar receita para edição.");
    }
  }

  async function excluirReceita(id) {
    try {
      await db.collection("receitas").doc(id).delete();
      return true;
    } catch (e) {
      console.error("Erro ao excluir receita:", e);
      alert("Erro ao excluir a receita. Tente novamente.");
      return false;
    }
  }
});
