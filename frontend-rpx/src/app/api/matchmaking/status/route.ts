import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb/connect";
import { ObjectId } from "mongodb";

// Interface para o jogador de uma partida
interface MatchPlayer {
  userId: string;
  username: string;
  avatar?: string;
  lobbyId?: string;
  [key: string]: any;
}

// GET: Verificar o status de matchmaking para o usuário atual
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;
    const { db } = await connectToDatabase();

    // Verificar se o usuário ainda está na fila de matchmaking
    const queueEntry = await db.collection("matchmaking_queue").findOne({
      $or: [
        { userId },
        { "players.userId": userId }
      ]
    });

    if (queueEntry) {
      // Se o usuário está na fila, retornar o status "searching"
      return new Response(
        JSON.stringify({
          status: "searching",
          queuedAt: queueEntry.createdAt,
          message: "Procurando partida...",
          waitingId: queueEntry._id.toString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Se o usuário não está na fila, verificar se está em um match
    const match = await db.collection("matches").findOne({
      "players.userId": userId,
      status: { $in: ["waiting", "ready", "in_progress", "completed"] }
    });

    if (!match) {
      // Usuário não está nem na fila nem em um match
      return new Response(
        JSON.stringify({
          status: "idle",
          message: "Não está em matchmaking",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Usuário está em um match
    // Verificar quantos jogadores estão nessa partida
    const totalPlayers = match.players.length;
    const expectedPlayers = match.maxPlayers || match.players.length; // Usar maxPlayers se disponível
    
    let matchStatus = match.status;
    let statusMessage = "";

    switch (matchStatus) {
      case "waiting":
        statusMessage = `Partida encontrada! Aguardando jogadores... (${totalPlayers}/${expectedPlayers})`;
        break;
      case "ready":
        statusMessage = "Todos os jogadores conectados! Preparando partida...";
        break;
      case "in_progress":
        statusMessage = "Partida em andamento";
        break;
      case "completed":
        statusMessage = "Partida concluída";
        break;
      default:
        statusMessage = "Estado desconhecido";
    }

    // Obter informações detalhadas dos jogadores para o cliente
    const players = match.players.map((player: MatchPlayer) => ({
      userId: player.userId,
      username: player.username,
      avatar: player.avatar || "/images/avatars/default.png",
      lobbyId: player.lobbyId,
      ready: player.ready || false,
      team: player.team || null
    }));

    return new Response(
      JSON.stringify({
        status: matchStatus,
        matchId: match.matchId || match._id.toString(),
        gameType: match.gameType,
        message: statusMessage,
        players,
        createdAt: match.createdAt,
        matchDetails: {
          map: match.map || "random",
          mode: match.mode || "classic",
          ranked: match.ranked || false,
          teams: match.teams || null
        },
        matchFound: true
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao verificar status de matchmaking:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 