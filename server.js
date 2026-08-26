const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Função para tratar código enviado com multiplicador (ex: "5*789123...")
function processarCodigoComQuantidade(entrada) {
  let quantidade = 1;
  let codigo = String(entrada || '').trim();

  if (codigo.includes('*')) {
    const partes = codigo.split('*');
    const qtdParsed = parseInt(partes[0], 10);
    if (!isNaN(qtdParsed) && qtdParsed > 0) {
      quantidade = qtdParsed;
      codigo = partes[1] || '';
    }
  }

  return { codigo: codigo.trim(), quantidade };
}

io.on('connection', (socket) => {
  console.log('[Socket] Novo cliente conectado:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`[Socket] Cliente entrou na sala: ${roomId}`);
  });

  // Receber evento de código de barras
  socket.on('barcode', (data) => {
    let rawCode = '';
    let qtd = 1;
    let roomId = null;

    if (typeof data === 'object' && data !== null) {
      rawCode = data.code || data.codigo || '';
      qtd = data.quantity || data.quantidade || 1;
      roomId = data.roomId || null;
    } else {
      rawCode = data;
    }

    // Se a string contiver o asterisco (ex: 6*789123), separa a quantidade do código
    if (typeof rawCode === 'string' && rawCode.includes('*')) {
      const processado = processarCodigoComQuantidade(rawCode);
      rawCode = processado.codigo;
      qtd = processado.quantidade;
    }

    const payload = {
      codigo: rawCode,
      quantidade: Number(qtd) || 1,
      timestamp: new Date().toISOString()
    };

    console.log(`[Leitura PDV] Código: ${payload.codigo} | Qtd: ${payload.quantidade}`);

    // Transmite para o frontend com objeto completo { codigo, quantidade }
    if (roomId) {
      io.to(roomId).emit('code-received', payload);
      io.to(roomId).emit('barcode', payload);
    } else {
      io.emit('code-received', payload);
      io.emit('barcode', payload);
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n=== PDV Simulador rodando em http://localhost:${PORT} ===\n`);
});
