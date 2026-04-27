require("dotenv").config();

const { parseNews, authenticate, publishNews } = require("./lib/tabnews");

async function main() {
  const email = process.env.TABNEWS_EMAIL;
  const password = process.env.TABNEWS_PASSWORD;
  const intervalMinutes =
    parseInt(process.env.PUBLISH_INTERVAL_MINUTES, 10) || 15;

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
