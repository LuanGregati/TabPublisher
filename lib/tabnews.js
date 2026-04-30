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
          .replaceAll('$', '\\$')
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

async function authenticate(email, password) {
  const response = await fetch("https://www.tabnews.com.br/api/v1/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.message || JSON.stringify(data) || `HTTP ${response.status}`,
    );
  }

  return data.token;
}

async function publishNews(sessionId, newsItem) {
  const response = await fetch("https://www.tabnews.com.br/api/v1/contents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session_id=${sessionId}`,
    },
    body: JSON.stringify({
      title: newsItem.title,
      body: newsItem.body,
      source_url: newsItem.url,
      status: "published",
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.message || JSON.stringify(data) || `HTTP ${response.status}`,
    );
  }

  return data;
}

module.exports = {
  parseNews,
  authenticate,
  publishNews,
};
