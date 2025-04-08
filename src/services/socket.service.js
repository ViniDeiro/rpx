/**
 * Serviço de WebSockets com Socket.IO
 */
const setupSocketListeners = (io) => {
  console.log('Configurando listeners do Socket.IO...');
  
  // Listener para conexão de clientes
  io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);
    
    // Listener para desconexão
    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
    
    // Outros listeners seriam adicionados aqui
  });
};

module.exports = {
  setupSocketListeners
}; 