document.addEventListener("DOMContentLoaded", () => {
  const db = firebase.firestore();
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      localStorage.setItem("backPage", "/admin/receitas.html");
      window.location.href = "/pages/login.html";
    }
  });

  exibirReceitasNaTabela(db);
});

async function exibirReceitasNaTabela(db) {
  const receitas = await pegarReceitas(db);
  const tabela = document.getElementById("tabelaReceitas");
  const totalSpan = document.getElementById("totalReceitas");
  const estatisticaTotal = document.getElementById("estatisticaTotal");

  tabela.innerHTML = "";

  if (receitas.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">
          Nenhuma receita cadastrada ainda.<br />
          <a href="cadastro-receitas.html" class="btn btn-primary btn-sm mt-2">
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
    const {
      id,
      nomeReceita,
      categoriaReceita,
      tempoPreparo,
      rendimento,
      custoTotal = 0,
      custoPorcao = 0,
    } = receita;

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${nomeReceita}</td>
      <td>${categoriaReceita}</td>
      <td>${tempoPreparo} min</td>
      <td>${rendimento}</td>
      <td>R$ ${Number(custoTotal).toFixed(2)}</td>
      <td>R$ ${Number(custoPorcao).toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-primary">Ver</button>
        <button class="btn btn-sm btn-danger btn-excluir" data-id="${id}">Excluir</button>
      </td>
    `;

    tabela.appendChild(linha);

    // Estatísticas
    const custoNum = parseFloat(custoPorcao);
    const tempoNum = parseFloat(tempoPreparo);
    if (custoNum < menorCusto) menorCusto = custoNum;
    if (custoNum > maiorCusto) maiorCusto = custoNum;
    somaTempo += tempoNum;
  });

  totalSpan.textContent = `${receitas.length} receita${receitas.length > 1 ? 's' : ''}`;
  estatisticaTotal.textContent = receitas.length;

  document.getElementById("receitaMaisBarata").textContent = `R$ ${menorCusto.toFixed(2)}`;
  document.getElementById("receitaMaisCara").textContent = `R$ ${maiorCusto.toFixed(2)}`;
  document.getElementById("tempoMedio").textContent = `${Math.round(somaTempo / receitas.length)} min`;

  // 🔁 Adiciona listeners nos botões de excluir
  document.querySelectorAll(".btn-excluir").forEach((botao) => {
    botao.addEventListener("click", async () => {
      const id = botao.getAttribute("data-id");
      const confirmado = confirm("Tem certeza que deseja excluir esta receita?");
      if (confirmado) {
        await excluirReceita(id);
        exibirReceitasNaTabela(firebase.firestore()); // Atualiza a tabela
      }
    });
  });
}

async function pegarReceitas(db) {
  const querySnapshot = await db.collection("receitas").get();

  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function excluirReceita(id) {
  console.log("Excluindo receita:", id);
  try {
    await firebase.firestore().collection("receitas").doc(id).delete();
    console.log("Receita excluída com sucesso:", id);
    return true;
  } catch (e) {
    console.error("Erro ao excluir receita:", e);
    alert("Erro ao excluir a receita. Tente novamente.");
    return false;
  }
}
