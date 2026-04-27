import { useMemo, useState, useRef, useEffect } from "react";

const parseNews = (text) => {
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

        body = body
          .replace(/As informações são (?:do|da|de)(?: site)? .*\.?$/i, "")
          .trim();

        if (body.length > 0) {
          body = body.charAt(0).toUpperCase() + body.slice(1);
        }

        news.push({ url, title, body });
      }
    }
  }

  return news;
};

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [newsText, setNewsText] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [logs, setLogs] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);
  const [newsItems, setNewsItems] = useState([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = cancelRequested;
  }, [cancelRequested]);

  const parsedItems = useMemo(() => parseNews(newsText), [newsText]);

  const addLog = (message) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()} - ${message}`,
    ]);
  };

  const handleLogin = async () => {
    setLoginError("");
    if (!email || !password) {
      setLoginError("Preencha email e senha antes de autenticar.");
      return;
    }

    try {
      setStatusMessage("Autenticando...");
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Erro ao autenticar.");
      }

      setSessionId(result.sessionId);
      setLoginError("");
      setStatusMessage("Autenticado com sucesso.");
      addLog("Login realizado com sucesso.");
    } catch (error) {
      setLoginError(error.message);
      setStatusMessage("");
      addLog(`Falha no login: ${error.message}`);
    }
  };

  const handlePublish = async () => {
    if (!sessionId) {
      setStatusMessage("Faça login antes de publicar.");
      return;
    }

    const parsed = parseNews(newsText);
    if (parsed.length === 0) {
      setStatusMessage("Cole notícias válidas para publicar.");
      return;
    }

    const interval = Number(intervalMinutes);
    if (Number.isNaN(interval) || interval < 0) {
      setStatusMessage("Intervalo inválido.");
      return;
    }

    setNewsItems(parsed);
    setPublishedCount(0);
    setLogs([]);
    setCancelRequested(false);
    cancelRef.current = false;
    setIsPublishing(true);
    setStatusMessage("Publicando notícias...");

    try {
      for (let index = 0; index < parsed.length; index += 1) {
        if (cancelRef.current) {
          addLog("Publicação interrompida pelo usuário.");
          break;
        }

        const item = parsed[index];
        addLog(`Publicando: ${item.title}`);

        const response = await fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, newsItem: item }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Erro ao publicar notícia.");
        }

        setPublishedCount(index + 1);
        addLog(`OK`);

        if (index < parsed.length - 1 && !cancelRef.current && interval > 0) {
          addLog(
            `Aguardando ${interval} minuto(s) antes da próxima notícia...`,
          );

          // Quebrar o intervalo em pedaços de 1 segundo para permitir cancelamento imediato
          const totalSeconds = interval * 60;
          for (let sec = totalSeconds; sec > 0; sec -= 1) {
            if (cancelRef.current) {
              break;
            }
            setRemainingSeconds(sec);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          setRemainingSeconds(0);
        }
      }

      if (!cancelRef.current) {
        addLog("Todas as notícias foram publicadas.");
        setStatusMessage("Publicação finalizada.");
      } else {
        setStatusMessage("Processo interrompido.");
      }
    } catch (error) {
      addLog(`Erro: ${error.message}`);
      setStatusMessage(`Erro durante a publicação: ${error.message}`);
    } finally {
      setIsPublishing(false);
      setRemainingSeconds(0);
    }
  };

  const handleCancel = () => {
    if (!isPublishing) return;
    cancelRef.current = true;
    setCancelRequested(true);
    setStatusMessage("Cancelando... Aguarde o fim da tarefa atual.");
  };

  return (
    <div className="container">
      <main>
        <h1>TabPublisher</h1>
        <p>
          Faça login, cole as notícias, defina o intervalo e publique com
          controle de progresso.
        </p>

        <section className="card">
          <h2>1. Login</h2>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPublishing}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPublishing}
            />
          </label>
          <button onClick={handleLogin} disabled={isPublishing}>
            Autenticar
          </button>
          {loginError && <p className="error">{loginError}</p>}
          {sessionId && <p className="success">Sessão ativa</p>}
        </section>

        <section
          className="card"
          style={{
            opacity: sessionId ? 1 : 0.5,
            pointerEvents: sessionId ? "auto" : "none",
          }}
        >
          <h2>2. Notícias</h2>
          <textarea
            rows={14}
            value={newsText}
            onChange={(e) => setNewsText(e.target.value)}
            disabled={isPublishing || !sessionId}
            placeholder="Cole aqui as notícias separadas por bloco..."
          />
          <p>{parsedItems.length} notícias detectadas</p>
          <label>
            Intervalo (minutos)
            <input
              type="number"
              min="0"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(e.target.value)}
              disabled={isPublishing || !sessionId}
            />
          </label>
          <div className="button-row">
            <button
              onClick={handlePublish}
              disabled={isPublishing || !sessionId}
            >
              Publicar
            </button>
          </div>
        </section>

        <section
          className="card"
          style={{
            opacity: sessionId ? 1 : 0.5,
            pointerEvents: sessionId ? "auto" : "none",
          }}
        >
          <h2>3. Progresso</h2>
          <div className="progress-header">
            <div className="status-container">
              <p>
                Status:{" "}
                {statusMessage ||
                  (sessionId ? "Aguardando ação" : "Faça login para começar")}
              </p>
              {isPublishing && (
                <div className="spinner">
                  <span>⏳</span>
                </div>
              )}
            </div>
            {remainingSeconds > 0 && (
              <p className="timer">
                Próxima notícia em:{" "}
                <strong>{formatTime(remainingSeconds)}</strong>
              </p>
            )}
          </div>
          <p>
            Publicadas: {publishedCount} /{" "}
            {newsItems.length || parsedItems.length}
          </p>
          {isPublishing && (
            <div className="button-row">
              <button onClick={handleCancel} disabled={!isPublishing}>
                Interromper
              </button>
            </div>
          )}
          <div className="log-box">
            {logs.length === 0 ? (
              <p>Nenhum log ainda.</p>
            ) : (
              logs.map((entry, index) => <div key={index}>{entry}</div>)
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        .container {
          padding: 24px;
          max-width: 920px;
          margin: 0 auto;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        h1 {
          margin-bottom: 8px;
        }

        .card {
          background: #fafafa;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 18px;
          margin-top: 20px;
        }

        label {
          display: block;
          margin-bottom: 14px;
          font-weight: 600;
        }

        input,
        textarea {
          display: block;
          width: 98%;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          padding: 10px;
          margin-top: 8px;
          font-size: 14px;
          font-family: inherit;
        }

        textarea {
          resize: vertical;
        }

        button {
          background: #0070f3;
          border: none;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.16s ease;
        }

        button:hover:enabled {
          background: #0059c1;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .button-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .log-box {
          background: #111;
          color: #f5f5f5;
          border-radius: 10px;
          padding: 14px;
          min-height: 120px;
          font-family: Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-size: 13px;
          overflow: auto;
        }

        .success {
          color: #0070f3;
          font-weight: 700;
        }

        .error {
          color: #d32f2f;
          font-weight: 700;
          background: #ffebee;
          border: 1px solid #ef5350;
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 12px;
        }

        .status-container {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .status-container p {
          margin: 0;
        }

        .spinner {
          font-size: 24px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .timer {
          color: #ff6b6b;
          font-weight: 700;
          margin: 0;
          padding: 8px 12px;
          background: #ffe0e0;
          border-radius: 6px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
