package http

import (
	"link-do-backend/internal/service"
	"net/http"

	"github.com/kataras/iris/v12"
)

func NewRouter(
	authSvc *service.AuthService,
	collectionSvc *service.CollectionService,
	notionDBSvc *service.NotionDatabaseService,
	notionSvc *service.NotionService,
	taskSvc *service.TaskService,
	timerSvc *service.TimerService,
	syncSvc *service.SyncService,
	mcpOAuthSvc *service.McpOAuthService,
) *iris.Application {
	app := iris.New()
	app.Use(func(ctx iris.Context) {
		ctx.Header("Access-Control-Allow-Origin", "*")
		ctx.Header("Access-Control-Allow-Credentials", "true")
		ctx.Header("Access-Control-Allow-Headers", "*")
		ctx.Header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, X-Requested-With, Content-Type, Accept, X-Access-Token,Token")
		ctx.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if ctx.Method() == "OPTIONS" {
			ctx.StatusCode(http.StatusOK)
			return
		}

		ctx.Next()
	})
	app.AllowMethods(iris.MethodOptions)

	app.Use(func(ctx iris.Context) {
		ctx.Next()
	})

	app.Get("/health", func(ctx iris.Context) {
		ctx.WriteString("ok")
	})

	// MCP OAuth endpoints (no auth required)
	mcpOAuthHandler := NewMcpOAuthHandler(mcpOAuthSvc)
	app.Get("/.well-known/oauth-authorization-server", mcpOAuthHandler.Metadata)
	app.Get("/oauth/authorize", mcpOAuthHandler.Authorize)
	app.Post("/oauth/login", mcpOAuthHandler.Login)
	app.Post("/oauth/token", mcpOAuthHandler.Token)
	app.Post("/oauth/introspect", mcpOAuthHandler.Introspect)

	// Debug endpoint (no auth required)
	debugHandler := NewDebugHandler()
	app.Get("/debug", debugHandler.Info)

	api := app.Party("/api/v1")
	api.Use(AuthMiddleware)

	// Auth
	authHandler := NewAuthHandler(authSvc, notionSvc)
	api.Get("/auth/notion/url", authHandler.GetOAuthURL)
	api.Get("/auth/notion/callback", authHandler.Callback)
	api.Get("/auth/notion/databases", authHandler.SearchDatabases)
	api.Get("/auth/me", authHandler.Me)
	api.Post("/auth/logout", authHandler.Logout)
	api.Post("/auth/email/send-code", authHandler.SendVerificationCode)
	api.Post("/auth/email/verify", authHandler.VerifyCode)

	// Collections
	collectionHandler := NewCollectionHandler(collectionSvc)
	api.Get("/collections", collectionHandler.List)
	api.Post("/collections", collectionHandler.Create)
	api.Get("/collections/{uuid:string}", collectionHandler.Get)
	api.Patch("/collections/{uuid:string}", collectionHandler.Update)
	api.Delete("/collections/{uuid:string}", collectionHandler.Delete)

	// Notion Databases
	notionDBHandler := NewNotionDatabaseHandler(notionDBSvc)
	api.Get("/notion-databases", notionDBHandler.List)
	api.Get("/notion-databases/{uuid:string}", notionDBHandler.Get)
	api.Post("/notion-databases", notionDBHandler.Create)
	api.Patch("/notion-databases/{uuid:string}", notionDBHandler.Update)
	api.Delete("/notion-databases/{uuid:string}", notionDBHandler.Delete)
	api.Get("/collections/{uuid:string}/notion-databases", notionDBHandler.GetByCollection)
	api.Get("/notion-databases/{uuid:string}/status-mapping", notionDBHandler.GetStatusMapping)
	api.Put("/notion-databases/{uuid:string}/status-mapping", notionDBHandler.UpdateStatusMapping)
	api.Post("/notion-databases/{uuid:string}/status-mapping/fetch", notionDBHandler.FetchStatusOptions)

	// Tasks
	taskHandler := NewTaskHandler(taskSvc)
	api.Post("/collections/{uuid:string}/tasks", taskHandler.Create)
	api.Get("/collections/{uuid:string}/tasks", taskHandler.List)
	api.Patch("/tasks/{uuid:string}", taskHandler.Update)
	api.Patch("/tasks/{uuid:string}/status", taskHandler.UpdateStatus)
	api.Delete("/tasks/{uuid:string}", taskHandler.Delete)

	// Timer
	timerHandler := NewTimerHandler(timerSvc)
	api.Post("/tasks/{uuid:string}/timer/start", timerHandler.Start)
	api.Post("/tasks/{uuid:string}/timer/stop", timerHandler.Stop)
	api.Get("/timer/current", timerHandler.Current)

	// Sync
	syncHandler := NewSyncHandler(syncSvc)
	api.Post("/sync", syncHandler.Sync)

	return app
}
