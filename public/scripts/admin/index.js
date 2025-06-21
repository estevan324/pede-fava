import { getEstoqueIngrediente } from "../common.js";

document.addEventListener("DOMContentLoaded", async () => {
  const sensitiveValues = document.querySelectorAll(".sensitive-value");
  const db = firebase.firestore();

  const estoqueBaixoLabel = document.getElementById("estoqueBaixo");
  const quantidadeReceitasLabel = document.getElementById("quantidadeReceitas");

  async function loadItensEstoqueBaixo() {
    const ingredientes = await getEstoqueIngrediente(db);
    let estoqueBaixo = 0;
    for (const ingrediente of ingredientes) {
      let estoqueMinimo = ingrediente?.estoqueMinimo || 5;
      if (ingrediente.estoqueAtual < estoqueMinimo) estoqueBaixo++;
    }
    estoqueBaixoLabel.textContent = estoqueBaixo;
  }

  async function loadQuantidadeReceitas() {
    const receitasSnapshot = await db.collection("receitas").get();

    quantidadeReceitasLabel.textContent = receitasSnapshot.size;
  }

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      sensitiveValues.forEach((value) => {
        value.textContent = "-";
      });
    } else {
      await Promise.all([loadItensEstoqueBaixo(), loadQuantidadeReceitas()]);
    }
  });
});
