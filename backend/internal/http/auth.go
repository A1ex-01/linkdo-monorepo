package http

import (
	"context"
	"link-do-backend/internal/service"

	"github.com/kataras/iris/v12"
)

type AuthHandler struct {
	svc       *service.AuthService
	notionSvc *service.NotionService
}

func NewAuthHandler(svc *service.AuthService, notionSvc *service.NotionService) *AuthHandler {
	return &AuthHandler{svc: svc, notionSvc: notionSvc}
}

func (h *AuthHandler) GetOAuthURL(ctx iris.Context) {
	url := h.svc.GetOAuthURL()
	ctx.JSON(iris.Map{"success": true, "data": iris.Map{"url": url}})
}

func (h *AuthHandler) Callback(ctx iris.Context) {
	code := ctx.Request().URL.Query().Get("code")
	if code == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "missing code"})
		return
	}
	userUUID, name, err := h.svc.HandleCallback(ctx, code)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": iris.Map{"token": userUUID, "name": name}})
}

// SearchDatabases searches for Notion databases accessible by the user
func (h *AuthHandler) SearchDatabases(ctx iris.Context) {
	query := ctx.URLParamDefault("query", "")
	userID := ctx.Values().GetUintDefault("userID", 0)
	databases, err := h.notionSvc.SearchDatabases(ctx, userID, query)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": databases})
}

func (h *AuthHandler) Me(ctx iris.Context) {
	user := ctx.Values().Get("user")
	if user == nil {
		ctx.JSON(iris.Map{"success": false, "error": "user not found"})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": user})
}

func (h *AuthHandler) Logout(ctx iris.Context) {
	ctx.JSON(iris.Map{"success": true})
}

type SendCodeRequest struct {
	Email string `json:"email"`
}

func (h *AuthHandler) SendVerificationCode(ctx iris.Context) {
	var req SendCodeRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid request"})
		return
	}

	if req.Email == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "email is required"})
		return
	}

	if err := h.svc.SendVerificationCode(context.Background(), req.Email); err != nil {
		if err == service.ErrRateLimited {
			ctx.StatusCode(429)
			ctx.JSON(iris.Map{"success": false, "error": err.Error()})
			return
		}
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"success": true, "message": "verification code sent"})
}

type VerifyCodeRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

func (h *AuthHandler) VerifyCode(ctx iris.Context) {
	var req VerifyCodeRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid request"})
		return
	}

	if req.Email == "" || req.Code == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "email and code are required"})
		return
	}

	token, err := h.svc.VerifyCode(context.Background(), req.Email, req.Code)
	if err != nil {
		switch err {
		case service.ErrCodeExpired:
			ctx.StatusCode(400)
			ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		case service.ErrCodeInvalidated:
			ctx.StatusCode(400)
			ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		case service.ErrInvalidCode:
			ctx.StatusCode(400)
			ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		case service.ErrInvalidEmail:
			ctx.StatusCode(400)
			ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		default:
			ctx.StatusCode(500)
			ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		}
		return
	}

	ctx.JSON(iris.Map{"success": true, "data": iris.Map{"token": token}})
}
