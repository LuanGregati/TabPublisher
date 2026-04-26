const axios = require("axios");
require("dotenv").config();

function parseNews(text) {
  const news = [];
  const blocks = text.split("\n\n").filter((block) => block.trim());
  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    if (lines.length >= 2) {
      const url = lines[0];
      const titleBody = lines.slice(1).join(" ");
      const colonIndex = titleBody.indexOf(":");
      if (colonIndex !== -1) {
        let title = titleBody.substring(0, colonIndex).trim();
        let body = titleBody.substring(colonIndex + 1).trim();
        // Remove "As informações são do site X." / "As informações são da X."
        body = body.replace(/As informações são (?:do|da|de)(?: site)? .*\.?$/i, "").trim();
        if (body.length > 0) {
          body = body.charAt(0).toUpperCase() + body.slice(1);
        }
        news.push({ url, title, body });
      }
    }
  }
  return news;
}

async function authenticate(email, password) {
  try {
    const response = await axios.post("http://localhost:3000/api/v1/sessions", {
      email,
      password,
    });
    const sessionId = response.data.token;
    console.log("Login realizado com sucesso.");
    return sessionId;
  } catch (error) {
    console.error("Erro no login:", error.response?.data || error.message);
    throw error;
  }
}

async function publishNews(sessionId, newsItem) {
  try {
    const response = await axios.post(
      "http://localhost:3000/api/v1/contents",
      {
        title: newsItem.title,
        body: newsItem.body,
        source_url: newsItem.url,
        status: "published",
      },
      {
        headers: {
          Cookie: `session_id=${sessionId}`,
        },
      },
    );
    console.log(`Notícia publicada: ${newsItem.title}`);
    return response.data;
  } catch (error) {
    console.error(
      `Erro ao publicar notícia "${newsItem.title}":`,
      error.response?.data || error.message,
    );
    throw error;
  }
}

async function main() {
  const email = process.env.TABNEWS_EMAIL;
  const password = process.env.TABNEWS_PASSWORD;
  const intervalMinutes = parseInt(process.env.PUBLISH_INTERVAL_MINUTES) || 15;

  if (!email || !password) {
    console.error(
      "Variáveis de ambiente TABNEWS_EMAIL e TABNEWS_PASSWORD são obrigatórias.",
    );
    process.exit(1);
  }

  let input = "";
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", async () => {
    try {
      const news = parseNews(input);
      if (news.length === 0) {
        console.error("Nenhuma notícia encontrada no input.");
        process.exit(1);
      }

      const sessionId = await authenticate(email, password);

      for (let i = 0; i < news.length; i++) {
        const item = news[i];
        await publishNews(sessionId, item);
        if (i < news.length - 1) {
          console.log(
            `Aguardando ${intervalMinutes} minutos até a próxima publicação...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, intervalMinutes * 60 * 1000),
          );
        }
      }

      console.log("Todas as notícias foram publicadas.");
    } catch (error) {
      console.error("Erro geral:", error.message);
      process.exit(1);
    }
  });
}

main();
