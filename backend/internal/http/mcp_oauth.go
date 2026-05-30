package http

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"html/template"
	"strings"

	"link-do-backend/internal/service"

	"github.com/kataras/iris/v12"
)

type McpOAuthHandler struct {
	svc *service.McpOAuthService
}

func NewMcpOAuthHandler(svc *service.McpOAuthService) *McpOAuthHandler {
	return &McpOAuthHandler{svc: svc}
}

// OAuthMetadata serves the OAuth 2.0 Authorization Server metadata.
func (h *McpOAuthHandler) Metadata(ctx iris.Context) {
	baseURL := getBaseURL(ctx)
	ctx.JSON(map[string]any{
		"issuer":                           baseURL,
		"authorization_endpoint":           baseURL + "/oauth/authorize",
		"token_endpoint":                   baseURL + "/oauth/token",
		"response_types_supported":         []string{"code"},
		"grant_types_supported":            []string{"authorization_code"},
		"code_challenge_methods_supported": []string{"S256", "plain"},
		"scopes_supported":                 []string{"mcp:tools"},
		"service_documentation":            baseURL + "/oauth/docs",
	})
}

// Authorize GET shows the login form.
func (h *McpOAuthHandler) Authorize(ctx iris.Context) {
	clientID := ctx.URLParamDefault("client_id", "")
	redirectURI := ctx.URLParamDefault("redirect_uri", "")
	state := ctx.URLParamDefault("state", "")
	scope := ctx.URLParamDefault("scope", "mcp:tools")
	codeChallenge := ctx.URLParamDefault("code_challenge", "")
	responseType := ctx.URLParamDefault("response_type", "code")

	if responseType != "code" {
		ctx.StatusCode(400)
		ctx.WriteString("Only response_type=code is supported")
		return
	}

	ctx.ViewData("ClientID", clientID)
	ctx.ViewData("RedirectURI", redirectURI)
	ctx.ViewData("State", state)
	ctx.ViewData("Scopes", strings.Join(strings.Fields(scope), " "))
	ctx.ViewData("CodeChallenge", codeChallenge)
	ctx.ViewData("BaseURL", getBaseURL(ctx))
	_ = ctx.View("oauth_login.html")
}

// Token POST handles authorization_code grant exchange.
func (h *McpOAuthHandler) Token(ctx iris.Context) {
	grantType := ctx.PostValue("grant_type")
	code := ctx.PostValue("code")
	clientID := ctx.PostValue("client_id")
	clientSecret := ctx.PostValue("client_secret")
	redirectURI := ctx.PostValue("redirect_uri")

	if grantType != "authorization_code" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"error": "unsupported_grant_type"})
		return
	}
	if code == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"error": "invalid_request", "error_description": "missing code"})
		return
	}

	_ = clientSecret // For now, accept any client_secret

	tokenData, err := h.svc.ExchangeCode(ctx, struct {
		Code        string
		ClientID    string
		RedirectURI string
	}{
		Code:        code,
		ClientID:    clientID,
		RedirectURI: redirectURI,
	})
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"error": "invalid_grant", "error_description": err.Error()})
		return
	}

	ctx.JSON(map[string]any{
		"access_token": tokenData.Token,
		"token_type":   "bearer",
		"expires_in":   3600,
		"scope":        strings.Join(tokenData.Scopes, " "),
	})
}

// Introspect verifies an MCP access token (RFC 7662).
func (h *McpOAuthHandler) Introspect(ctx iris.Context) {
	token := ctx.PostValue("token")
	if token == "" {
		ctx.JSON(iris.Map{"active": false})
		return
	}

	data, err := h.svc.VerifyToken(ctx, token)
	if err != nil || data == nil {
		ctx.JSON(iris.Map{"active": false})
		return
	}

	ctx.JSON(iris.Map{
		"active":       true,
		"scope":        strings.Join(data.Scopes, " "),
		"client_id":    data.ClientID,
		"exp":          data.ExpiresAt.Unix(),
		"user_id":      data.UserUUID,
		"linkdo_token": data.LinkdoToken,
	})
}

// Login POST validates the Link-Do token and issues an OAuth code.
func (h *McpOAuthHandler) Login(ctx iris.Context) {
	linkdoToken := ctx.PostValue("token")
	clientID := ctx.PostValue("client_id")
	redirectURI := ctx.PostValue("redirect_uri")
	state := ctx.PostValue("state")
	scope := ctx.PostValue("scope")
	codeChallenge := ctx.PostValue("code_challenge")

	if linkdoToken == "" {
		showLoginForm(ctx, clientID, redirectURI, state, scope, codeChallenge, "Link-Do token is required.")
		return
	}

	code, err := h.svc.GenerateCode(ctx, struct {
		ClientID      string
		RedirectURI   string
		State         string
		Scopes        []string
		CodeChallenge string
		LinkdoToken   string
	}{
		ClientID:      clientID,
		RedirectURI:   redirectURI,
		State:         state,
		Scopes:        strings.Fields(scope),
		CodeChallenge: codeChallenge,
		LinkdoToken:   linkdoToken,
	})
	if err != nil {
		showLoginForm(ctx, clientID, redirectURI, state, scope, codeChallenge,
			fmt.Sprintf("Invalid Link-Do token. Please check your token and try again."))
		return
	}

	// Redirect with code
	target := buildRedirectURL(redirectURI, code, state)
	ctx.Redirect(target, iris.StatusFound)
}

func showLoginForm(ctx iris.Context, clientID, redirectURI, state, scope, codeChallenge, errMsg string) {
	// baseURL := getBaseURL(ctx)
	html := oauthLoginHTML(clientID, redirectURI, state, scope, codeChallenge, errMsg)
	ctx.Header("Content-Type", "text/html; charset=utf-8")
	ctx.WriteString(html)
}

func oauthLoginHTML(clientID, redirectURI, state, scope, codeChallenge, errMsg string) string {
	scopeDisplay := scope
	if scopeDisplay == "" {
		scopeDisplay = "mcp:tools"
	}
	errorBlock := ""
	if errMsg != "" {
		errorBlock = fmt.Sprintf(`<div class="error">%s</div>`, template.HTMLEscapeString(errMsg))
	}
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Link-Do — Authorize MCP</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0e0e0f; color: #e5e2e3; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .card { background: #1a1a1d; border: 1px solid rgba(77,67,84,0.3); border-radius: 12px; padding: 40px; width: 100%%; max-width: 420px; }
  .logo { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
  .subtitle { color: #8a8a8e; font-size: 14px; margin-bottom: 28px; }
  .scope { background: rgba(108,99,255,0.1); border: 1px solid rgba(108,99,255,0.2); border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #a5a0ff; margin-bottom: 20px; }
  .field { margin-bottom: 18px; }
  label { display: block; font-size: 13px; color: #8a8a8e; margin-bottom: 6px; }
  input { width: 100%%; padding: 10px 12px; background: #201f20; border: 1px solid rgba(77,67,84,0.3); border-radius: 8px; color: #e5e2e3; font-size: 14px; outline: none; transition: border-color 0.15s; }
  input:focus { border-color: #6c63ff; }
  .btn { width: 100%%; padding: 11px; background: #6c63ff; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
  .btn:hover { background: #5a52e0; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 10px; color: #fca5a5; font-size: 13px; margin-bottom: 16px; }
  .note { margin-top: 20px; text-align: center; font-size: 12px; color: #555; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">📋 Link-Do</div>
  <div class="subtitle">Authorize MCP access to your tasks</div>

  %s

  <div class="scope">Requested scope: <strong>%s</strong></div>

  <form method="post" action="/oauth/login">
    <input type="hidden" name="client_id" value="%s">
    <input type="hidden" name="redirect_uri" value="%s">
    <input type="hidden" name="state" value="%s">
    <input type="hidden" name="scope" value="%s">
    <input type="hidden" name="code_challenge" value="%s">

    <div class="field">
      <label for="token">Link-Do API Token</label>
      <input type="password" id="token" name="token" placeholder="eyJ..." autocomplete="off" required>
    </div>
    <button type="submit" class="btn">Authorize</button>
  </form>

  <div class="note">Your token is validated against the Link-Do backend and never stored by this server.</div>
</div>
</body>
</html>`, errorBlock, template.HTMLEscapeString(scopeDisplay),
		template.HTMLEscapeString(clientID), template.HTMLEscapeString(redirectURI),
		template.HTMLEscapeString(state), template.HTMLEscapeString(scope),
		template.HTMLEscapeString(codeChallenge))
}

func getBaseURL(ctx iris.Context) string {
	return ctx.Scheme() + "://" + ctx.Host()
}

func buildRedirectURL(rawURL, code, state string) string {
	if rawURL == "" {
		return "/"
	}
	sep := "?"
	if strings.Contains(rawURL, "?") {
		sep = "&"
	}
	result := rawURL + sep + "code=" + code
	if state != "" {
		result += "&state=" + state
	}
	return result
}

func generateRandomHex(length int) string {
	bytes := make([]byte, length)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
