package http

import (
	"github.com/kataras/iris/v12"
	"link-do-backend/internal/config"
	"link-do-backend/internal/database"
)

type DebugHandler struct{}

func NewDebugHandler() *DebugHandler {
	return &DebugHandler{}
}

func (h *DebugHandler) Info(ctx iris.Context) {
	cfg := config.Get()
	var dbStats map[string]interface{}
	if database.DB != nil {
		sqlDB, err := database.DB.DB()
		if err == nil {
			stats := sqlDB.Stats()
			dbStats = map[string]interface{}{
				"open_connections": stats.OpenConnections,
				"in_use":           stats.InUse,
				"idle":             stats.Idle,
			}
		}
	}
	ctx.JSON(iris.Map{
		"debug":    true,
		"version":  "1.0",
		"port":     cfg.Port,
		"database": dbStats,
	})
}
