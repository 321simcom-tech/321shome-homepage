exports.handler = async (event) => {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return { statusCode: 500, body: "GITHUB_OAUTH_CLIENT_ID 환경변수가 설정되지 않았습니다." };
  }

  const siteUrl = process.env.URL || `https://${event.headers.host}`;
  const redirectUri = `${siteUrl}/api/callback`;
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);

  const authorizeUrl =
    "https://github.com/login/oauth/authorize" +
    "?client_id=" + encodeURIComponent(clientId) +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&scope=repo" +
    "&state=" + encodeURIComponent(state);

  return {
    statusCode: 302,
    headers: {
      Location: authorizeUrl,
      "Set-Cookie": `decap_oauth_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax`
    },
    body: ""
  };
};
