const { parseNews } = require("./newsParser");

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
    body: JSON.stringify(
      (() => {
        const payload = {
          title: newsItem.title,
          body: newsItem.body,
          status: "published",
        };

        // Only set `source_url` when there is exactly one source.
        if (Array.isArray(newsItem.sources) && newsItem.sources.length === 1) {
          payload.source_url = newsItem.sources[0] || newsItem.url || "";
        } else if (!Array.isArray(newsItem.sources) && newsItem.url) {
          // Backwards compatibility: if `sources` is not provided but `url` exists, use it.
          payload.source_url = newsItem.url;
        }

        return payload;
      })(),
    ),
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
