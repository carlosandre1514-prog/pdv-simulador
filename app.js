// PRODUTOS PADRÃO (CARREGADOS CASO NÃO HAJA NADA NA MEMÓRIA)
const PRODUTOS_PADRAO = [
  { codigo: "7891", nome: "ARROZ 5KG", preco: 24.90 },
  { codigo: "7892", nome: "FEIJAO CARIOCA 1KG", preco: 7.50 },
  { codigo: "7893", nome: "OLEO DE SOJA 900ML", preco: 6.80 },
  { codigo: "7894", nome: "CAFE MOIDO 500G", preco: 16.90 },
  { codigo: "7895", nome: "REFRIGERANTE 2L", preco: 8.50 }
];

// INICIALIZAÇÃO DA MEMÓRIA LOCAL (LOCALSTORAGE)
let produtosBD = JSON.parse(localStorage.getItem("pdv_produtos"));

if (!produtosBD || produtosBD.length === 0) {
  produtosBD = PRODUTOS_PADRAO;
  salvarProdutosMemoria();
}

let historicoVendas = JSON.parse(localStorage.getItem("pdv_historico_vendas")) || [];
let sangriasBD = JSON.parse(localStorage.getItem("pdv_sangrias")) || [];

let carrinho = [];
let totalVenda = 0;

// Elementos Principais DOM
const inputBarra = document.getElementById("barcode-input");
const listaItens = document.getElementById("lista-itens");
const totalVal = document.getElementById("total-val");
const qtdItensBadge = document.getElementById("qtd-itens-badge");

// Modais DOM
const modalCadastro = document.getElementById("modal-cadastro");
const modalPagamento = document.getElementById("modal-pagamento");
const modalCupom = document.getElementById("modal-cupom");
const modalRelatorio = document.getElementById("modal-relatorio");
const modalSangria = document.getElementById("modal-sangria");

// Salva array no LocalStorage
function salvarProdutosMemoria() {
  localStorage.setItem("pdv_produtos", JSON.stringify(produtosBD));
}

// Bipagem de Código de Barras
inputBarra.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && inputBarra.value.trim() !== "") {
    const entrada = inputBarra.value.trim();
    inputBarra.value = "";

    let quantidade = 1;
    let codigoBuscado = entrada;

    if (entrada.includes("*")) {
      const partes = entrada.split("*");
      quantidade = parseInt(partes[0]) || 1;
      codigoBuscado = partes[1];
    }

    const produtoEncontrado = produtosBD.find(p => p.codigo === codigoBuscado);

    if (produtoEncontrado) {
      for (let i = 0; i < quantidade; i++) {
        carrinho.push(produtoEncontrado);
      }
      atualizarPDV();
    } else {
      alert(`[ERRO]: Produto '${codigoBuscado}' não cadastrado na memória! Pressione F3 para cadastrar.`);
    }
  }
});

function atualizarPDV() {
  listaItens.innerHTML = "";
  totalVenda = 0;

  carrinho.forEach((item, index) => {
    totalVenda += Number(item.preco);
    listaItens.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.codigo}</td>
        <td>${item.nome}</td>
        <td>1x</td>
        <td>R$ ${Number(item.preco).toFixed(2)}</td>
        <td>R$ ${Number(item.preco).toFixed(2)}</td>
      </tr>`;
  });

  totalVal.textContent = totalVenda.toFixed(2).replace(".", ",");
  qtdItensBadge.textContent = `${carrinho.length} itens`;
}

// Ações dos Atalhos
function acaoF2() {
  if (carrinho.length === 0) return alert("Carrinho vazio!");
  abrirModalPagamento();
}

function acaoF3() {
  renderizarProdutosMemoria();
  modalCadastro.classList.remove("hidden");
  document.getElementById("cad-codigo").focus();
}

function acaoF7() {
  if (carrinho.length > 0) {
    const removido = carrinho.pop();
    atualizarPDV();
  }
}

function acaoF8() {
  gerarRelatorioZ();
  modalRelatorio.classList.remove("hidden");
}

function acaoF9() {
  document.getElementById("input-sangria-val").value = "";
  document.getElementById("input-sangria-obs").value = "";
  modalSangria.classList.remove("hidden");
  document.getElementById("input-sangria-val").focus();
}

function acaoEsc() {
  if (!modalCadastro.classList.contains("hidden")) modalCadastro.classList.add("hidden");
  else if (!modalPagamento.classList.contains("hidden")) fecharModalPagamento();
  else if (!modalRelatorio.classList.contains("hidden")) modalRelatorio.classList.add("hidden");
  else if (!modalSangria.classList.contains("hidden")) modalSangria.classList.add("hidden");
  else if (carrinho.length > 0 && confirm("Deseja CANCELAR toda a venda atual?")) {
    carrinho = [];
    atualizarPDV();
  }
}

// Event Listeners Botões
document.getElementById("btn-f2").addEventListener("click", acaoF2);
document.getElementById("btn-f3").addEventListener("click", acaoF3);
document.getElementById("btn-f7").addEventListener("click", acaoF7);
document.getElementById("btn-f8").addEventListener("click", acaoF8);
document.getElementById("btn-f9").addEventListener("click", acaoF9);
document.getElementById("btn-esc").addEventListener("click", acaoEsc);

// Teclado Físico
document.addEventListener("keydown", (e) => {
  if (e.key === "F2") { e.preventDefault(); acaoF2(); }
  else if (e.key === "F3") { e.preventDefault(); acaoF3(); }
  else if (e.key === "F7") { e.preventDefault(); acaoF7(); }
  else if (e.key === "F8") { e.preventDefault(); acaoF8(); }
  else if (e.key === "F9") { e.preventDefault(); acaoF9(); }
  else if (e.key === "Escape") { acaoEsc(); }
});

// Cadastro e Exibição de Produtos em Memória
document.getElementById("btn-salvar-prod").addEventListener("click", () => {
  const cod = document.getElementById("cad-codigo").value.trim();
  const nome = document.getElementById("cad-nome").value.trim().toUpperCase();
  const preco = parseFloat(document.getElementById("cad-preco").value);

  if (!cod || !nome || isNaN(preco)) {
    alert("Preencha todos os campos corretamente!");
    return;
  }

  // Se o código já existe, atualiza
  const indexExistente = produtosBD.findIndex(p => p.codigo === cod);
  if (indexExistente >= 0) {
    produtosBD[indexExistente] = { codigo: cod, nome: nome, preco: preco };
  } else {
    produtosBD.push({ codigo: cod, nome: nome, preco: preco });
  }

  salvarProdutosMemoria();
  renderizarProdutosMemoria();

  document.getElementById("cad-codigo").value = "";
  document.getElementById("cad-nome").value = "";
  document.getElementById("cad-preco").value = "";
  document.getElementById("cad-codigo").focus();
});

function renderizarProdutosMemoria() {
  const tbody = document.getElementById("lista-produtos-memoria");
  document.getElementById("count-prod-salvos").textContent = produtosBD.length;
  tbody.innerHTML = "";

  produtosBD.forEach((prod, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${prod.codigo}</td>
        <td>${prod.nome}</td>
        <td>R$ ${Number(prod.preco).toFixed(2)}</td>
        <td><button class="btn-del" onclick="excluirProdutoMemoria(${index})">Excluir</button></td>
      </tr>`;
  });
}

function excluirProdutoMemoria(index) {
  if (confirm("Remover este produto da memória interna?")) {
    produtosBD.splice(index, 1);
    salvarProdutosMemoria();
    renderizarProdutosMemoria();
  }
}

document.getElementById("btn-fechar-cad").addEventListener("click", () => {
  modalCadastro.classList.add("hidden");
  inputBarra.focus();
});

// Pagamento & Troco
const modalTotal = document.getElementById("modal-total");
const modalForma = document.getElementById("modal-forma");
const inputRecebido = document.getElementById("input-recebido");
const modalTroco = document.getElementById("modal-troco");
const tefScreen = document.getElementById("simulador-tef");
const tefStatus = document.getElementById("tef-status");

function abrirModalPagamento() {
  modalTotal.textContent = `R$ ${totalVenda.toFixed(2).replace(".", ",")}`;
  inputRecebido.value = "";
  modalTroco.textContent = "R$ 0,00";
  tefScreen.classList.add("hidden");
  modalPagamento.classList.remove("hidden");
  inputRecebido.focus();
}

function fecharModalPagamento() {
  modalPagamento.classList.add("hidden");
  inputBarra.focus();
}

inputRecebido.addEventListener("input", () => {
  const recebido = parseFloat(inputRecebido.value) || 0;
  const troco = recebido - totalVenda;
  modalTroco.textContent = troco >= 0 ? `R$ ${troco.toFixed(2).replace(".", ",")}` : "R$ 0,00";
});

document.getElementById("btn-confirmar-venda").addEventListener("click", () => {
  const forma = modalForma.value;
  const recebido = parseFloat(inputRecebido.value) || 0;

  if (forma === "DINHEIRO" && recebido < totalVenda) {
    alert("Valor recebido é insuficiente!");
    return;
  }

  if (forma.includes("CARTAO")) {
    tefScreen.classList.remove("hidden");
    tefStatus.textContent = "APROXIME OU INSIRA O CARTÃO...";
    setTimeout(() => { tefStatus.textContent = "PROCESSANDO TRANSAÇÃO..."; }, 1200);
    setTimeout(() => { 
      tefStatus.textContent = "TRANSAÇÃO APROVADA!";
      setTimeout(gerarCupomFinal, 800);
    }, 2500);
  } else {
    gerarCupomFinal();
  }
});

document.getElementById("btn-cancelar-modal").addEventListener("click", fecharModalPagamento);

// Sangria
document.getElementById("btn-confirmar-sangria").addEventListener("click", () => {
  const valor = parseFloat(document.getElementById("input-sangria-val").value);
  const obs = document.getElementById("input-sangria-obs").value.trim() || "Retirada de caixa";

  if (isNaN(valor) || valor <= 0) {
    alert("Informe um valor válido!");
    return;
  }

  sangriasBD.push({
    id: Date.now(),
    valor: valor,
    obs: obs,
    hora: new Date().toLocaleTimeString("pt-BR")
  });
  localStorage.setItem("pdv_sangrias", JSON.stringify(sangriasBD));

  alert(`Sangria de R$ ${valor.toFixed(2).replace(".", ",")} registrada!`);
  modalSangria.classList.add("hidden");
  inputBarra.focus();
});

document.getElementById("btn-fechar-sangria").addEventListener("click", () => {
  modalSangria.classList.add("hidden");
  inputBarra.focus();
});

// Emissão de Cupom
function gerarCupomFinal() {
  modalPagamento.classList.add("hidden");

  historicoVendas.push({
    id: Date.now(),
    total: totalVenda,
    forma: modalForma.value,
    itensQtd: carrinho.length
  });
  localStorage.setItem("pdv_historico_vendas", JSON.stringify(historicoVendas));

  const conteudo = document.getElementById("cupom-conteudo");
  conteudo.innerHTML = "";

  carrinho.forEach((item, idx) => {
    conteudo.innerHTML += `
      <div>
        <span>${idx+1}. ${item.nome}</span>
        <span>R$ ${item.preco.toFixed(2)}</span>
      </div>`;
  });

  const recebido = parseFloat(inputRecebido.value) || totalVenda;
  const troco = recebido - totalVenda;

  document.getElementById("cupom-total-txt").textContent = `TOTAL: R$ ${totalVenda.toFixed(2).replace(".", ",")}`;
  document.getElementById("cupom-forma-txt").textContent = `FORMA: ${modalForma.value}`;
  document.getElementById("cupom-troco-txt").textContent = `TROCO: R$ ${(troco > 0 ? troco : 0).toFixed(2).replace(".", ",")}`;

  modalCupom.classList.remove("hidden");
}

document.getElementById("btn-fechar-cupom").addEventListener("click", () => {
  modalCupom.classList.add("hidden");
  carrinho = [];
  atualizarPDV();
  inputBarra.focus();
});

// Relatório Z
function gerarRelatorioZ() {
  let totalGeral = 0, totalDinheiro = 0, totalCredito = 0, totalDebito = 0, totalPix = 0, totalSangria = 0;

  historicoVendas.forEach(v => {
    totalGeral += v.total;
    if (v.forma === "DINHEIRO") totalDinheiro += v.total;
    else if (v.forma === "CARTAO_CREDITO") totalCredito += v.total;
    else if (v.forma === "CARTAO_DEBITO") totalDebito += v.total;
    else if (v.forma === "PIX") totalPix += v.total;
  });

  sangriasBD.forEach(s => totalSangria += s.valor);

  document.getElementById("rel-qtd-vendas").textContent = historicoVendas.length;
  document.getElementById("rel-total-geral").textContent = `R$ ${totalGeral.toFixed(2).replace(".", ",")}`;
  document.getElementById("rel-dinheiro").textContent = `R$ ${totalDinheiro.toFixed(2).replace(".", ",")}`;
  document.getElementById("rel-sangria").textContent = `R$ ${totalSangria.toFixed(2).replace(".", ",")}`;
  document.getElementById("rel-saldo-gaveta").textContent = `R$ ${(totalDinheiro - totalSangria).toFixed(2).replace(".", ",")}`;
  document.getElementById("rel-credito").textContent = `R$ ${totalCredito.toFixed(2).replace(".", ",")}`;
  document.getElementById("rel-debito").textContent = `R$ ${totalDebito.toFixed(2).replace(".", ",")}`;
  document.getElementById("rel-pix").textContent = `R$ ${totalPix.toFixed(2).replace(".", ",")}`;
}

document.getElementById("btn-fechar-relatorio").addEventListener("click", () => {
  modalRelatorio.classList.add("hidden");
  inputBarra.focus();
});

document.getElementById("btn-zerar-caixa").addEventListener("click", () => {
  if (confirm("Zerar relatório diário? (Os produtos cadastrados continuarão salvos na memória)")) {
    historicoVendas = [];
    sangriasBD = [];
    localStorage.removeItem("pdv_historico_vendas");
    localStorage.removeItem("pdv_sangrias");
    gerarRelatorioZ();
  }
});
