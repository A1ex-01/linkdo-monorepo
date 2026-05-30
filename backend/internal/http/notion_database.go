package http

import (
	"link-do-backend/internal/service"

	"github.com/kataras/iris/v12"
)

type NotionDatabaseHandler struct {
	svc *service.NotionDatabaseService
}

func NewNotionDatabaseHandler(svc *service.NotionDatabaseService) *NotionDatabaseHandler {
	return &NotionDatabaseHandler{svc: svc}
}

func (h *NotionDatabaseHandler) List(ctx iris.Context) {
	databases, err := h.svc.GetAll()
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": databases})
}

func (h *NotionDatabaseHandler) GetByCollection(ctx iris.Context) {
	collectionUUID := ctx.Params().GetString("uuid")
	if collectionUUID == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid collection uuid"})
		return
	}
	databases, err := h.svc.GetByCollectionUUID(collectionUUID)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": databases})
}

func (h *NotionDatabaseHandler) Get(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid uuid"})
		return
	}
	db, err := h.svc.GetByUUID(uuid)
	if err != nil {
		ctx.StatusCode(404)
		ctx.JSON(iris.Map{"success": false, "error": "not found"})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": db})
}

func (h *NotionDatabaseHandler) Create(ctx iris.Context) {
	var req struct {
		CollectionUUID   string `json:"collection_uuid"`
		NotionDatabaseID string `json:"notion_database_id"`
		Name             string `json:"name"`
		Icon             string `json:"icon"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid request"})
		return
	}
	nd, err := h.svc.Create(ctx, req.CollectionUUID, req.NotionDatabaseID, req.Name, req.Icon)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.StatusCode(201)
	ctx.JSON(iris.Map{"success": true, "data": nd})
}

func (h *NotionDatabaseHandler) Update(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		return
	}
	var req struct {
		Name string `json:"name"`
		Icon string `json:"icon"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		return
	}
	if err := h.svc.Update(uuid, req.Name, req.Icon); err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true})
}

func (h *NotionDatabaseHandler) Delete(ctx iris.Context) {
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

// UpdateStatusMapping updates the status mapping for a notion database
func (h *NotionDatabaseHandler) UpdateStatusMapping(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid uuid"})
		return
	}
	var req struct {
		Mapping map[string]string `json:"mapping"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid request"})
		return
	}
	if err := h.svc.UpdateStatusMapping(uuid, req.Mapping); err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true})
}

// FetchStatusOptions fetches status options from Notion (does not save mapping)
func (h *NotionDatabaseHandler) FetchStatusOptions(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid uuid"})
		return
	}
	userID := ctx.Values().GetUintDefault("userID", 0)
	options, err := h.svc.FetchStatusOptions(ctx, uuid, userID)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"success": false, "error": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": options})
}

// GetStatusMapping returns the current status mapping along with available Notion options
func (h *NotionDatabaseHandler) GetStatusMapping(ctx iris.Context) {
	uuid := ctx.Params().GetString("uuid")
	if uuid == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"success": false, "error": "invalid uuid"})
		return
	}
	result, err := h.svc.GetStatusMapping(uuid)
	if err != nil {
		ctx.StatusCode(404)
		ctx.JSON(iris.Map{"success": false, "error": "not found"})
		return
	}
	ctx.JSON(iris.Map{"success": true, "data": result})
}
