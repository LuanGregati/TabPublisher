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
    return res
      .status(401)
      .json({ message: error.message || "Falha ao autenticar." });
  }
}
