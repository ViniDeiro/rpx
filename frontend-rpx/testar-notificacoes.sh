#!/bin/bash

# Verificar se o script tem permissão de execução
if [ ! -x "$0" ]; then
  echo "Este script precisa de permissão de execução."
  echo "Execute: chmod +x testar-notificacoes.sh"
  exit 1
fi

clear
echo "================================================================"
echo "             FERRAMENTA DE TESTE DE NOTIFICACOES RPX.GG"
echo "================================================================"
echo ""

# Verificar e instalar dependências
if [ ! -d "node_modules/mongodb" ]; then
  echo "Instalando dependências necessárias..."
  npm install mongodb dotenv
fi

# Função para exibir o menu
exibir_menu() {
  clear
  echo "================================================================"
  echo "             FERRAMENTA DE TESTE DE NOTIFICACOES RPX.GG"
  echo "================================================================"
  echo ""
  echo " [1] Criar convite de lobby manualmente"
  echo " [2] Listar convites pendentes de um usuário"
  echo " [3] Verificar notificações de um usuário"
  echo " [4] Copiar script de debug para o clipboard"
  echo " [5] Sobre o sistema de notificações"
  echo " [0] Sair"
  echo ""
  echo "================================================================"
  echo ""
}

# Função para criar convite
criar_convite() {
  clear
  echo "================================================================"
  echo "                CRIAR CONVITE DE LOBBY MANUALMENTE"
  echo "================================================================"
  echo ""
  echo "Informe os IDs necessários:"
  echo ""
  
  read -p "ID do Lobby: " lobbyId
  read -p "ID do Usuário que convida: " userId
  read -p "ID do Usuário convidado: " recipientId
  
  echo ""
  echo "Criando convite..."
  echo ""
  
  node src/scripts/test-lobby-invite.js create "$lobbyId" "$userId" "$recipientId"
  
  echo ""
  read -p "Pressione Enter para continuar..." dummy
}

# Função para listar convites
listar_convites() {
  clear
  echo "================================================================"
  echo "                LISTAR CONVITES PENDENTES"
  echo "================================================================"
  echo ""
  
  read -p "ID do Usuário: " userId
  
  echo ""
  echo "Buscando convites pendentes..."
  echo ""
  
  node src/scripts/test-lobby-invite.js list "$userId"
  
  echo ""
  read -p "Pressione Enter para continuar..." dummy
}

# Função para verificar notificações
verificar_notificacoes() {
  clear
  echo "================================================================"
  echo "                VERIFICAR NOTIFICAÇÕES"
  echo "================================================================"
  echo ""
  
  read -p "ID do Usuário: " userId
  
  echo ""
  echo "Buscando notificações..."
  echo ""
  
  node src/scripts/test-lobby-invite.js check "$userId"
  
  echo ""
  read -p "Pressione Enter para continuar..." dummy
}

# Função para copiar script para o clipboard
copiar_script() {
  clear
  echo "================================================================"
  echo "            COPIAR SCRIPT DE DEBUG PARA O CLIPBOARD"
  echo "================================================================"
  echo ""
  echo "O script para debug no navegador será copiado para sua área de transferência."
  echo "Cole-o no console do desenvolvedor (F12) do navegador."
  echo ""
  
  # Verificar qual comando de clipboard está disponível
  if command -v pbcopy > /dev/null; then
    # macOS
    cat src/scripts/debug-notifications.js | pbcopy
    clipboard_cmd="pbcopy"
  elif command -v xclip > /dev/null; then
    # Linux com xclip
    cat src/scripts/debug-notifications.js | xclip -selection clipboard
    clipboard_cmd="xclip"
  elif command -v xsel > /dev/null; then
    # Linux com xsel
    cat src/scripts/debug-notifications.js | xsel --clipboard
    clipboard_cmd="xsel"
  else
    echo "AVISO: Nenhum comando de clipboard encontrado (pbcopy, xclip, xsel)."
    echo "O script será exibido na tela. Você precisará copiá-lo manualmente."
    echo ""
    echo "Pressione Enter para ver o script..."
    read dummy
    cat src/scripts/debug-notifications.js
    echo ""
    echo "Copie o texto acima para o clipboard manualmente."
    read -p "Pressione Enter quando terminar..." dummy
    return
  fi
  
  echo "Script copiado com sucesso usando $clipboard_cmd!"
  echo ""
  echo "Instruções:"
  echo "1. Abra o site RPX.GG e faça login"
  echo "2. Pressione F12 para abrir o console do desenvolvedor"
  echo "3. Cole o script no console e pressione Enter"
  echo "4. Use os comandos listados na documentação para testar"
  echo ""
  read -p "Pressione Enter para continuar..." dummy
}

# Função para exibir informações sobre o sistema
sobre() {
  clear
  echo "================================================================"
  echo "                SOBRE O SISTEMA DE NOTIFICAÇÕES"
  echo "================================================================"
  echo ""
  echo "O sistema de notificações da RPX.GG inclui as seguintes funcionalidades:"
  echo ""
  echo "1. Notificações no aplicativo (bell icon)"
  echo "2. Convites para lobby"
  echo "3. Notificações push (opcional, se configurado)"
  echo ""
  echo "Para mais informações, consulte a documentação:"
  echo "- frontend-rpx/docs/TESTE_NOTIFICACOES.md"
  echo "- frontend-rpx/docs/NOTIFICATIONS.md"
  echo ""
  read -p "Pressione Enter para continuar..." dummy
}

# Loop principal
while true; do
  exibir_menu
  read -p "Escolha uma opção: " opcao
  
  case $opcao in
    1) criar_convite ;;
    2) listar_convites ;;
    3) verificar_notificacoes ;;
    4) copiar_script ;;
    5) sobre ;;
    0) 
      echo ""
      echo "Encerrando a ferramenta de teste..."
      echo ""
      exit 0
      ;;
    *) 
      echo "Opção inválida!"
      sleep 2
      ;;
  esac
done 