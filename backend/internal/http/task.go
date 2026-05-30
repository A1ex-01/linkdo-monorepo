package http

import (
	"link-do-backend/internal/models"
	"link-do-backend/internal/service"

	"github.com/kataras/iris/v12"
)

type TaskHandler struct {
	svc *service.TaskService
}

func NewTaskHandler(svc *service.TaskService) *TaskHandler {
	return &TaskHandler{svc: svc}
}

func (h *TaskHandler) List(ctx iris.Context) {
	collectionUUID := ctx.Params().GetString("uuid")
	if collectionUUID == "" {
		ctx.StatusCode(400)
		return
	}

	tasks, err := h.svc.List(collectionUUID)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": tasks})
}

func (h *TaskHandler) Create(ctx iris.Context) {
	collectionUUID := ctx.Params().GetString("uuid")
	if collectionUUID == "" {
		ctx.StatusCode(400)
		return
	}
	var req struct {
		Title              string `json:"title"`
		EstimatedTime      int    `json:"estimated_time"`
		NotionDatabaseUUID string `json:"notion_database_uuid"`
		Status             string `json:"status"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid request"})
		return
	}

	if req.NotionDatabaseUUID == "" {
		req.NotionDatabaseUUID = "ae3d894f-65d1-44e8-b8c7-76b1af9a86b6"
	}

	task, err := h.svc.Create(ctx, collectionUUID, &req.NotionDatabaseUUID, req.Title, req.EstimatedTime,
		models.TaskStatus(req.Status),
	)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.StatusCode(201)
	ctx.JSON(iris.Map{"success": true, "data": task})
}

func (h *TaskHandler) Update(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		return
	}
	var req struct {
		Title         string `json:"title"`
		EstimatedTime int    `json:"estimated_time"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		return
	}
	if err := h.svc.Update(uuid, req.Title, req.EstimatedTime); err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true})
}

func (h *TaskHandler) UpdateStatus(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		return
	}
	var req struct {
		Status string `json:"status"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		return
	}
	if err := h.svc.UpdateStatus(ctx, uuid, models.TaskStatus(req.Status)); err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true})
}

func (h *TaskHandler) Delete(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		return
	}
	if err := h.svc.Delete(uuid); err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true})
}
