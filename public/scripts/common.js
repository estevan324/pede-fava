async function getEstoqueIngrediente(db) {
  const ingredientes = [];

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

  for (const ingrediente of ingredienteSnapshot.docs) {
    const data = ingrediente.data();

    const movimentacoesDoIngrediente =
      movimentacoesPorIngrediente.get(ingrediente.id) || [];

    movimentacoesDoIngrediente.sort(
      (a, b) => (b.dataMovimentacao || 0) - (a.dataMovimentacao || 0)
    );

    let estoqueAtual =
      movimentacoesDoIngrediente.length > 0
        ? movimentacoesDoIngrediente[0].estoqueAtual
        : 0;

    ingredientes.push({
      id: ingrediente.id,
      estoqueAtual,
      ...data,
    });
  }

  return ingredientes;
}

export { getEstoqueIngrediente };
