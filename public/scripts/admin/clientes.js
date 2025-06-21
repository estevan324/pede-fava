document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();

  const btnSalvarCliente = document.getElementById("btnSalvarCliente");

  const formCliente = document.getElementById("formCliente");
  const nomeInput = document.getElementById("nome");
  const emailInput = document.getElementById("email");
  const telefoneInput = document.getElementById("telefone");

  const tabelaClientesBody = document.getElementById("tabelaClientes");
  const totalClientesSpan = document.getElementById("totalClientes");

  const tituloFormulario = document.getElementById("tituloFormulario");

  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      localStorage.setItem("backPage", "/admin/clientes.html");
      window.location.href = "/pages/login.html";
    }
  });

  let clientes = [];
  let clienteAtual = null;

  document.getElementById("openModalCadastro").addEventListener("click", () => {
    tituloFormulario.textContent = "Cadastro de cliente";

    formCliente.reset();
    formCliente.classList.remove("was-validated");
  });

  function openModalEdicao(id) {
    tituloFormulario.textContent = "Edição de cliente";

    formCliente.reset();
    formCliente.classList.remove("was-validated");

    clienteAtual = clientes.find((c) => c.id === id);

    nomeInput.value = clienteAtual?.nome || "";
    telefoneInput.value = clienteAtual?.telefone || "";
    emailInput.value = clienteAtual?.email || "";

    const modalElement = document.getElementById("cadastrarClientes");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

  async function deleteCliente(clienteId) {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        const batch = db.batch();

        const clienteRef = db.collection("clientes").doc(clienteId);
        batch.delete(clienteRef);

        await batch.commit();

        alert("Cliente excluido com sucesso!");
        await getAndDisplayClientes();
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        alert(
          "Erro ao excluir o cliente. Verifique o console para mais detalhes."
        );
      }
    }
  }

  async function getAndDisplayClientes() {
    try {
      clientes = [];
      const clientesSnapshot = await db.collection("clientes").get();

      for (const clienteDoc of clientesSnapshot.docs) {
        const data = clienteDoc.data();
        const clienteId = clienteDoc.id;

        clientes.push({
          id: clienteId,
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          timestamp: data.timestamp || null,
        });
      }

      tabelaClientesBody.innerHTML = "";
      totalClientesSpan.innerHTML = `${clientes.length} clientes`;

      if (clientes.length > 0) {
        clientes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        clientes.forEach((cliente) => {
          const row = tabelaClientesBody.insertRow();
          row.insertCell(0).textContent = cliente.nome;
          row.insertCell(1).textContent = cliente.email;
          row.insertCell(2).textContent = cliente.telefone;

          const actionsCell = row.insertCell(3);
          actionsCell.innerHTML = `
            <button class="btn btn-sm btn-info me-2 btn-editar" data-id="${cliente.id}">Editar</button>
            <button class="btn btn-sm btn-danger btn-excluir" data-id="${cliente.id}">Excluir</button>
          `;

          actionsCell
            .querySelector(".btn-excluir")
            .addEventListener("click", () => {
              deleteCliente(cliente.id);
            });

          actionsCell
            .querySelector(".btn-editar")
            .addEventListener("click", () => {
              openModalEdicao(cliente.id);
            });
        });
      } else {
        tabelaClientesBody.innerHTML = `
                <tr>
                  <td colspan="4" class="text-center text-muted">
                    Nenhum cliente cadastrado
                  </td>
                </tr>
            `;
      }
    } catch (error) {
      console.error("Erro ao obter clientes:", error);
      alert("Erro ao carregar clientes. Verifique o console.");
    }
  }

  await getAndDisplayClientes();

  btnSalvarCliente.addEventListener("click", async (event) => {
    event.preventDefault();

    if (!formCliente.checkValidity()) {
      formCliente.classList.add("was-validated");
      return;
    }

    const nome = nomeInput.value;
    const email = emailInput.value;
    const telefone = telefoneInput.value;

    if (!nome || !email || !telefone) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      if (clienteAtual) {
        let clienteRef = db.collection("clientes").doc(clienteAtual.id);

        await clienteRef.update({
          nome,
          email,
          telefone,
        });
      } else {
        await db.collection("clientes").add({
          nome,
          email,
          telefone,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }

      alert("Cliente salvo com sucesso!");

      formCliente.reset();
      formCliente.classList.remove("was-validated");
      const modalElement = document.getElementById("cadastrarClientes");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }

      await getAndDisplayClientes();
    } catch (e) {
      console.error("Erro ao salvar documento: ", e);
      alert(
        "Erro ao salvar o cliente. Verifique o console para mais detalhes."
      );
    }
  });

  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      localStorage.setItem("backPage", "/admin/ingredientes.html");
      window.location.href = "/pages/login.html";
    }
  });
});
