const parseNews = (text) => {
  const news = [];
  const blocks = text.split(/\n\s*\n/).filter((block) => block.trim());

  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      continue;
    }

    const sourceUrls = [];
    let contentStartIndex = 0;

    while (
      contentStartIndex < lines.length &&
      /^https?:\/\//i.test(lines[contentStartIndex])
    ) {
      sourceUrls.push(lines[contentStartIndex]);
      contentStartIndex += 1;
    }

    const contentLines = lines.slice(contentStartIndex);

    if (contentLines.length < 1) {
      continue;
    }

    const contentText = contentLines.join(" ");
    const colonIndex = contentText.indexOf(":");

    let title = "";
    let body = "";

    if (colonIndex !== -1) {
      title = contentText.substring(0, colonIndex).trim();
      body = contentText.substring(colonIndex + 1).trim();
    } else {
      title = contentLines[0];
      body = contentLines.slice(1).join(" ").trim();
    }

    body = body.replace(/\s*As informações são\b.*$/i, "").trim();

    if (body.length > 0) {
      body = body.charAt(0).toUpperCase() + body.slice(1);
    }

    if (sourceUrls.length > 1) {
      const sourcesBlock = sourceUrls.map((source) => `- ${source}`).join("\n");
      body = body
        ? `${body}\n\nFontes:\n${sourcesBlock}`
        : `Fontes:\n${sourcesBlock}`;
    }

    if (title) {
      news.push({ url: sourceUrls[0] || "", title, body, sources: sourceUrls });
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
