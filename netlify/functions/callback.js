const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Set-Cookie": "decap_oauth_state=; Path=/; Max-Age=0"
};

function renderResult(payload) {
  const message = payload.error
    ? `authorization:github:error:${JSON.stringify(payload)}`
    : `authorization:github:success:${JSON.stringify(payload)}`;

  return `<!doctype html><html><body>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      ${JSON.stringify(message)},
      e.origin
    );
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body></html>`;
}

exports.handler = async (event) => {
  const { code, state } = event.queryStringParameters || {};
  const cookieHeader = event.headers.cookie || event.headers.Cookie || "";
  const cookieMatch = cookieHeader.match(/decap_oauth_state=([^;]+)/);
  const cookieState = cookieMatch && cookieMatch[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return { statusCode: 400, headers: HTML_HEADERS, body: renderResult({ error: "state_mismatch" }) };
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code
      })
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return {
        statusCode: 400,
        headers: HTML_HEADERS,
        body: renderResult({ error: tokenData.error_description || tokenData.error || "no_token" })
      };
    }

    return {
      statusCode: 200,
      headers: HTML_HEADERS,
      body: renderResult({ token: tokenData.access_token, provider: "github" })
    };
  } catch (err) {
    return { statusCode: 500, headers: HTML_HEADERS, body: renderResult({ error: "server_error" }) };
  }
};
