package http

import (
	"fmt"
	"link-do-backend/internal/service"

	"github.com/kataras/iris/v12"
)

type TimerHandler struct {
	svc *service.TimerService
}

func NewTimerHandler(svc *service.TimerService) *TimerHandler {
	return &TimerHandler{svc: svc}
}

func (h *TimerHandler) Start(ctx iris.Context) {
	taskUUID := ctx.Params().GetString("uuid")
	fmt.Println("taskUUID", taskUUID)
	if taskUUID == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid task uuid"})
		return
	}
	session, err := h.svc.Start(taskUUID)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": session})
}

func (h *TimerHandler) Stop(ctx iris.Context) {
	taskUUID := ctx.Params().GetString("uuid")
	fmt.Println("taskUUID stop", taskUUID)

	if taskUUID == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid task uuid"})
		return
	}
	if err := h.svc.Stop(taskUUID); err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true})
}

func (h *TimerHandler) Current(ctx iris.Context) {
	session, err := h.svc.GetActive()
	if err != nil {
		ctx.JSON(iris.Map{"success": true, "data": nil})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": session})
}
