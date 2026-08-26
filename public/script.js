const socket = io();
let carrinho = [];
let acaoPendenteSupervisor = null;

// Web Audio API para Sons Operacionais
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function tocarSom(tipo) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (tipo === 'bip') {
    osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.start(); osc.stop(audioCtx.currentTime + 0.08);
  } else if (tipo === 'erro') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.start(); osc.stop(audioCtx.currentTime + 0.25);
  }
}

function buscarProduto() {
  const codigo = document.getElementById('inputCodigo').value.trim();
  if (!codigo) return;
  socket.emit('consultar_produto', codigo);
  document.getElementById('inputCodigo').value = '';
}

socket.on('produto_encontrado', (produto) => {
  tocarSom('bip');
  
  // Regra de Atacado
  let itemExistente = carrinho.find(i => i.nome === produto.nome);
  let qtd = itemExistente ? itemExistente.qtd + 1 : 1;
  let precoFinal = produto.precoUnitario;

  if (produto.atacadoMin > 0 && qtd >= produto.atacadoMin) {
    precoFinal = produto.precoAtacado;
  }

  if (itemExistente) {
    itemExistente.qtd = qtd;
    itemExistente.precoUnitario = precoFinal;
    itemExistente.total = qtd * precoFinal;
  } else {
    carrinho.push({
      nome: produto.nome,
      qtd: 1,
      precoUnitario: produto.preco,
      total: produto.precoTotalItem || produto.preco
    });
  }
  atualizarTela();
});

socket.on('erro_produto', (msg) => {
  tocarSom('erro');
  alert(msg);
});

function atualizarTela() {
  const lista = document.getElementById('listaItens');
  const cupomItens = document.getElementById('cupomItens');
  lista.innerHTML = '';
  let htmlCupom = '';
  let totalGeral = 0;

  carrinho.forEach((item, index) => {
    totalGeral += item.total;
    lista.innerHTML += `<li>${item.qtd}x ${item.nome} - R$ ${item.total.toFixed(2)}</li>`;
    htmlCupom += `<div>${item.qtd}x ${item.nome} <br>R$ ${item.total.toFixed(2)}</div>`;
  });

  document.getElementById('spanTotal').innerText = totalGeral.toFixed(2);
  document.getElementById('cupomItens').innerHTML = htmlCupom || 'Nenhum item lançado';
}

function solicitarSupervisor(acao) {
  acaoPendenteSupervisor = acao;
  document.getElementById('modalSupervisor').style.display = 'flex';
}

function validarPin() {
  const pin = document.getElementById('inputPin').value;
  if (pin === '1234') {
    alert('Autorizado pelo supervisor!');
    fecharModais();
    if (acaoPendenteSupervisor === 'cancelar_item') {
      carrinho.pop();
      atualizarTela();
    }
  } else {
    tocarSom('erro');
    alert('PIN incorreto!');
  }
}

function abrirConfeRenCega() {
  document.getElementById('modalConferencia').style.display = 'flex';
}

function enviarConferenciaCega() {
  const informado = parseFloat(document.getElementById('inputValorGaveta').value) || 0;
  socket.emit('fechar_caixa_cego', { informado });
}

socket.on('relatorio_z_gerado', (rel) => {
  fecharModais();
  alert(`📊 RELATÓRIO Z GERADO\n\nVendas: R$ ${rel.vendasTotal.toFixed(2)}\nEsperado na Gaveta: R$ ${rel.esperado.toFixed(2)}\nInformado na Contagem: R$ ${rel.informado.toFixed(2)}\nDiferença (Quebra): R$ ${rel.diferenca.toFixed(2)}`);
  carrinho = [];
  atualizarTela();
});

function fecharModais() {
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
  document.getElementById('inputPin').value = '';
}

// Atalho Teclado F10
document.addEventListener('keydown', (e) => {
  if (e.key === 'F10') {
    e.preventDefault();
    if (carrinho.length > 0) {
      socket.emit('finalizar_venda', { total: carrinho.reduce((acc, i) => acc + i.total, 0), troco: 0 });
    }
  }
});
