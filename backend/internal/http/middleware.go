package http

import (
	"link-do-backend/internal/repository"
	"link-do-backend/internal/service"

	"github.com/kataras/iris/v12"
)

var userRepo *repository.UserRepository
var jwtSvc *service.JWTService

func SetUserRepo(repo *repository.UserRepository) {
	userRepo = repo
}

func SetJWTService(svc *service.JWTService) {
	jwtSvc = svc
}

func AuthMiddleware(ctx iris.Context) {
	path := ctx.Path()
	// Skip auth for public endpoints
	if path == "/api/v1/auth/email/send-code" ||
		path == "/api/v1/auth/email/verify" ||
		path == "/health" {
		ctx.Next()
		return
	}

	token := ctx.GetHeader("Authorization")
	if token == "" {
		ctx.StatusCode(401)
		ctx.JSON(iris.Map{"success": false, "error": "missing authorization"})
		return
	}
	if len(token) > 7 && token[:7] == "Bearer " {
		token = token[7:]
	}

	// Try JWT validation first
	if jwtSvc != nil {
		claims, err := jwtSvc.ValidateToken(token)
		if err == nil && claims.Email != "" {
			user, err := userRepo.GetByEmail(claims.Email)
			if err == nil {
				ctx.Values().Set("userID", user.ID)
				ctx.Values().Set("userUUID", user.UUID)
				ctx.Values().Set("user", user)
				ctx.Values().Set("email", claims.Email)
				ctx.Next()
				return
			}
		}
	}

	// Fallback to UUID token (legacy Notion OAuth)
	user, err := userRepo.GetByUUID(token)
	if err != nil {
		ctx.StatusCode(401)
		ctx.JSON(iris.Map{"success": false, "error": "invalid token"})
		return
	}
	ctx.Values().Set("userID", user.ID)
	ctx.Values().Set("userUUID", user.UUID)
	ctx.Values().Set("user", user)
	ctx.Next()
}

func ExtractEmail(ctx iris.Context) string {
	if email := ctx.Values().GetString("email"); email != "" {
		return email
	}
	user := ctx.Values().Get("user")
	if user == nil {
		return ""
	}
	if u, ok := user.(*repository.UserRepository); ok {
		_ = u
	}
	return ""
}
