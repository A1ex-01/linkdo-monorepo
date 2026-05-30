package http

import (
	"github.com/kataras/iris/v12"
	"link-do-backend/internal/service"
)

type SyncHandler struct {
	svc *service.SyncService
}

func NewSyncHandler(svc *service.SyncService) *SyncHandler {
	return &SyncHandler{svc: svc}
}

func (h *SyncHandler) Sync(ctx iris.Context) {
	userToken, _ := ctx.Values().Get("userID").(string)
	if err := h.svc.FullSync(ctx, userToken); err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true})
}