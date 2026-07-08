const { authenticate } = require("../../lib/tabnews");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Método não permitido" });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  try {
    const sessionId = await authenticate(email, password);
    return res.status(200).json({ sessionId });
  } catch (error) {
    const message = error.message || "Falha ao autenticar.";
    const statusCode =
      message.includes("HTTP 401") || message.includes("credenciais")
        ? 401
        : 500;

    return res.status(statusCode).json({ message });
  }
}
