package http

import (
	"github.com/kataras/iris/v12"
	"link-do-backend/internal/service"
)

type CollectionHandler struct {
	svc *service.CollectionService
}

func NewCollectionHandler(svc *service.CollectionService) *CollectionHandler {
	return &CollectionHandler{svc: svc}
}

func getUserID(ctx iris.Context) uint {
	return ctx.Values().GetUintDefault("userID", 0)
}

func (h *CollectionHandler) List(ctx iris.Context) {
	collections, err := h.svc.List(getUserID(ctx))
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": collections})
}

func (h *CollectionHandler) Get(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid uuid"})
		return
	}
	col, err := h.svc.GetByUUID(uuid, getUserID(ctx))
	if err != nil {
		ctx.StatusCode(404)
		ctx.JSON(iris.Map{"success": false, "error": "not found"})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": col})
}

func (h *CollectionHandler) Create(ctx iris.Context) {
	var req struct {
		Name string `json:"name"`
		Icon string `json:"icon"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid request"})
		return
	}
	col, err := h.svc.Create(ctx, getUserID(ctx), req.Name, req.Icon)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.StatusCode(201)
	ctx.JSON(iris.Map{"success": true, "data": col})
}

func (h *CollectionHandler) Update(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		return
	}
	var req struct {
		Name     string `json:"name"`
		Icon     string `json:"icon"`
		Archived bool   `json:"archived"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		return
	}
	if err := h.svc.Update(uuid, getUserID(ctx), req.Name, req.Icon, req.Archived); err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true})
}

func (h *CollectionHandler) Delete(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		return
	}
	if err := h.svc.Delete(uuid, getUserID(ctx)); err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true})
}
