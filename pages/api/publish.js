const { publishNews } = require("../../lib/tabnews");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Método não permitido" });
  }

  const { sessionId, newsItem } = req.body || {};
  if (
    !sessionId ||
    !newsItem ||
    !newsItem.title ||
    !newsItem.body ||
    !newsItem.url
  ) {
    return res
      .status(400)
      .json({ message: "Parâmetros inválidos para publicar." });
  }

  try {
    const published = await publishNews(sessionId, newsItem);
    return res.status(200).json({ published });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Erro ao publicar notícia." });
  }
}
