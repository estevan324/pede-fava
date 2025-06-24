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

  const pedidosAndamentoLabel = document.getElementById("pedidosAndamento");
const valorFaturadoLabel = document.getElementById("valorFaturado");



async function loadPedidosInfo() {
  const STATUS_EM_ANDAMENTO = "Em andamento";
  const STATUS_FATURADO = "Faturado";
  try {
    const pedidosSnapshot = await db.collection("pedidos").get();

    let totalFaturado = 0;
    let emAndamento = 0;

    pedidosSnapshot.forEach((doc) => {
      const pedido = doc.data();
      if (pedido.status === STATUS_FATURADO) {
        totalFaturado += Number(pedido.valorTotal || 0);
      } else if (pedido.status === STATUS_EM_ANDAMENTO) {
        emAndamento++;
      }
    });

    pedidosAndamentoLabel.textContent = emAndamento;
    valorFaturadoLabel.textContent = `R$ ${totalFaturado.toFixed(2)}`;
    } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        pedidosAndamentoLabel.textContent = "-";
        valorFaturadoLabel.textContent = "-";
    }
  }


  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      sensitiveValues.forEach((value) => {
        value.textContent = "-";
      });
    } else {
      await Promise.all([
        loadItensEstoqueBaixo(), 
        loadQuantidadeReceitas(),
        loadPedidosInfo()
      ]);
    }
  });
});
