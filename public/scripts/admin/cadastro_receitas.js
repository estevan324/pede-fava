const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

var ingredientes = await pegarIngredientes();
var estoque = await pegarEstoque();
const selectIngredientes = document.getElementById("ingredienteSelecionado");

document.getElementById("formReceita").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const receita = {};
  formData.forEach((value, key) => {
    receita[key] = value;
  });

  let resultado = await salvarReceita(receita);
  if(resultado){
    window.alert("Receita salva com sucesso!");
    window.location.href = "/admin/receitas.html";
  }
});

document.getElementById("adicionarIngrediente").addEventListener("click", () => {
  const select = document.getElementById("ingredienteSelecionado");
  const nome = select.options[select.selectedIndex].text;
  const id = select.value;
  const quantidade = parseFloat(document.getElementById("quantidadeIngrediente").value);
  const unidade = document.getElementById("unidadeIngrediente").value;

  if (!id || isNaN(quantidade) || quantidade <= 0) {
    alert("Preencha corretamente o ingrediente e a quantidade.");
    return;
  }

  const precoUnitario = parseFloat(select.selectedOptions[0].dataset.preco || "0"); // Caso tenha
  const custoTotal = (precoUnitario * quantidade).toFixed(2);

  const tbody = document.getElementById("listaIngredientesReceita");

  // Remove linha "Nenhum ingrediente adicionado"
  const linhaPlaceholder = document.getElementById("semIngredientes");
  if (linhaPlaceholder) linhaPlaceholder.remove();

  // Criar linha da tabela
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${nome}</td>
    <td>${quantidade}</td>
    <td>${unidade}</td>
    <td>R$ ${precoUnitario.toFixed(2)}</td>
    <td>R$ ${custoTotal}</td>
    <td>
      <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('tr').remove()">Remover</button>
    </td>
  `;

  tbody.appendChild(tr);

  // Limpar campos
  select.value = "";
  document.getElementById("quantidadeIngrediente").value = "";
  document.getElementById("unidadeIngrediente").value = "";
});


ingredientes.forEach(ingrediente => {
  const option = document.createElement("option");
  option.value = ingrediente.id;
  option.textContent = ingrediente.nome;
  selectIngredientes.appendChild(option);
});

console.log(ingredientes, estoque);
async function pegarIngredientes(){
  const querySnapshot = await getDocs(collection(db, "ingredientes"));
  var ingredientes = [];
  querySnapshot.forEach((doc) => {
    let temp = {
      id: doc.id,
      ...doc.data()
    };
    ingredientes.push(temp);
  });
  return ingredientes;
}

async function pegarEstoque(){
  const querySnapshot = await getDocs(collection(db, "movimentacoesEstoque"));
  var estoque = [];
  querySnapshot.forEach((doc) => {
    let temp = {
      id: doc.id,
      ...doc.data()
    };
    estoque.push(temp);
  });
  return estoque;
}

async function salvarReceita(data){
  try{
    const docRef = await addDoc(collection(db, "receitas"), data);
    console.log("Documento escrito com ID: ", docRef.id);
    return true;
  }catch (e) {
    console.error("Erro ao adicionar documento: ", e);
    alert("Erro ao salvar receita. Tente novamente.");
    return false;
  }
}