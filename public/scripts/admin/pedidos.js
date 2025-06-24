document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();

  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      localStorage.setItem("backPage", "/admin/pedidos.html");
      window.location.href = "/pages/login.html";
    }
  });

  const clientesSelect = document.getElementById("cliente");
  const receitaSelect = document.getElementById("receita");
  const proporcaoInput = document.getElementById("proporcao");
  const ingredientesNecessarios = document.getElementById(
    "ingredientesNecessarios"
  );

  const totalPedidosSpan = document.getElementById("totalPedidos");
  const tabelaPedidoBody = document.getElementById("tabelaPedidos");

  let pedidos = [];
  async function getPedidosAndDisplay() {
    try {
      pedidos = [];
      const pedidosSnapshot = await db.collection("pedidos").get();

      for (const pedidoDoc of pedidosSnapshot.docs) {
        const data = pedidoDoc.data();

        pedidos.push({
          id: pedidoDoc.id,
          ...data,
        });
      }
    tabelaPedidoBody.innerHTML = "";

      totalPedidosSpan.innerHTML = "";
      totalPedidosSpan.innerHTML = `${pedidos.length} pedidos`;

      if (pedidos.length > 0) {
        pedidos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        pedidos.forEach((pedido) => {
          const row = tabelaPedidoBody.insertRow();

          row.insertCell(0).textContent = pedido.cliente.nome;
          row.insertCell(1).textContent = pedido.receita.nome;
          row.insertCell(2).textContent = pedido.proporcao;
          row.insertCell(3).textContent = pedido.dataEntrega;
          row.insertCell(4).textContent = pedido.valorTotal;

          // TODO: colocar span no lugar do texto
          row.insertCell(5).textContent = pedido.status;

          const actionsCell = row.insertCell(6);

          actionsCell.innerHTML = `
            <button class="btn btn-sm btn-info me-2 btn-faturar" data-id="${pedido.id}">Faturar</button>
            <button class="btn btn-sm btn-danger btn-excluir" data-id="${pedido.id}">Excluir</button>
          `;
          actionsCell
            .querySelector(".btn-excluir")
            .addEventListener("click", () => {
              excluirPedido(pedido.id);
            });
          actionsCell
            .querySelector(".btn-faturar")
            .addEventListener("click", () => {
              // TODO: implementar
            });

          });
      } else {
        tabelaPedidoBody.innerHTML = `
                <tr>
                  <td colspan="7" class="text-center text-muted">
                    Nenhum pedido cadastrado
                  </td>
                </tr>
            `;
      }
    } catch (error) {
      console.error("Erro ao obter clientes:", error);
      alert("Erro ao carregar clientes. Verifique o console.");
    }
  }

  async function getClientes() {
    const clientesSnapshot = await db.collection("clientes").get();

    for (const clienteDoc of clientesSnapshot.docs) {
      const data = clienteDoc.data();

      const option = document.createElement("option");
      option.label = data.nome;
      option.value = clienteDoc.id;

      clientesSelect.add(option);
    }
  }

  const receitas = [];
  async function getReceitas() {
    const receitasSnapshot = await db.collection("receitas").get();

    for (const receitaDoc of receitasSnapshot.docs) {
      const data = receitaDoc.data();

      const option = document.createElement("option");
      option.label = data.nomeReceita;
      option.value = receitaDoc.id;

      receitaSelect.add(option);

      // TODO: retirar esse trecho de código, porém preencher no cadastro de receitas os ingredientes neste exato formato
      const ingredientes = [
        {
          nome: "Açúcar",
          medida: "g",
          quantidade: 500,
        },
        {
          nome: "Farinha de trigo",
          medida: "g",
          quantidade: 1000,
        },
        {
          nome: "Ovos",
          medida: "un",
          quantidade: 3,
        },
      ];

      receitas.push({
        id: receitaDoc.id,
        ingredientes,
        ...data,
      });
    }
  }

  function showIngredientes(idReceita) {
    ingredientesNecessarios.innerHTML = "";

    const receita = receitas.find((r) => r.id === idReceita);

    const proporcao = parseFloat(proporcaoInput.value) || 1;

    for (const ingrediente of receita.ingredientes) {
      const quantidadeNecessaria =
        parseFloat(ingrediente.quantidade) * proporcao;

      ingredientesNecessarios.innerHTML += `
                <div class="col-md-6 col-sm-4 mb-2">
                    <input
                        type="text"
                        class="form-control"
                        value="${ingrediente.nome || ""}"
                        readonly
                    />
                </div>
                <div class="col-md-3 col-sm-4 mb-2">
                    <input
                        type="number"
                        class="form-control"
                        value="${quantidadeNecessaria}"
                        readonly
                    />
                </div>
                <div class="col-md-3 col-sm-4 mb-2">
                    <input
                        type="text"
                        class="form-control"
                        value="${ingrediente.medida || ""}"
                        readonly
                    />
                </div>
            `;
    }
  }

  async function salvarPedido() {
    const clienteId = document.getElementById("cliente").value;
    const receitaId = document.getElementById("receita").value;
    const proporcao = parseFloat(document.getElementById("proporcao").value);
    const dataEntrega = document.getElementById("dataEntrega").value;
    const valorTotal = parseFloat(document.getElementById("valorTotal").value);

    if (!clienteId || !receitaId || !proporcao || !dataEntrega || !valorTotal) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    try {
      const clienteDoc = await firebase.firestore().collection("clientes").doc(clienteId).get();
      const receitaDoc = await firebase.firestore().collection("receitas").doc(receitaId).get();

      const clienteData = clienteDoc.data();
      const receitaData = receitaDoc.data();

      const novoPedido = {
        cliente: {
          id: clienteId,
          nome: clienteData.nome,
        },
        receita: {
          id: receitaId,
          nome: receitaData.nomeReceita,
        },
        proporcao,
        dataEntrega,
        valorTotal,
        status: "Em andamento",
        timestamp: Date.now(),
      };

      await firebase.firestore().collection("pedidos").add(novoPedido);

      await getPedidosAndDisplay();
      const modal = bootstrap.Modal.getInstance(document.getElementById("cadastrarPedido"));
      modal.hide();

      document.getElementById("formPedido").reset();
      document.getElementById("ingredientesNecessarios").innerHTML = `<p class="text-muted col-12">Os ingredientes necessários serão listados aqui após selecionar uma receita.</p>`;

      alert("Pedido salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido.");
    }
  }

  receitaSelect.addEventListener("change", (e) =>
    showIngredientes(e.target.value)
  );

  proporcaoInput.addEventListener("input", () => {
    console.log("oi");
    let receitaSelecionada = receitaSelect.value;

    if (receitaSelecionada) {
      showIngredientes(receitaSelecionada);
    }
  });

  await Promise.all([getClientes(), getReceitas(), getPedidosAndDisplay()]);
  document.getElementById("btnSalvarPedido").addEventListener("click", salvarPedido);

  async function excluirPedido(id) {
    const confirmado = confirm("Tem certeza que deseja excluir este pedido?");
    if (!confirmado) return;
  
    try {
      await firebase.firestore().collection("pedidos").doc(id).delete();
      console.log("Pedido excluído com sucesso:", id);
      await getPedidosAndDisplay(); // Atualiza a tabela
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
      alert("Erro ao excluir o pedido. Verifique o console.");
    }
  }
});
