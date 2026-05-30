package types

type Collection struct {
	ID               string            `json:"id"`
	Name             string            `json:"name"`
	Icon             string            `json:"icon"`
	Source           string            `json:"source"` // always "notion" for MVP
	NotionUUID       string            `json:"notion_uuid,omitempty"`
	PendingCount     int               `json:"pending_count"`
	EstimatedTotal   int               `json:"estimated_total"` // minutes
	Archived         bool              `json:"archived"`
	NotionDatabases  []*NotionDatabase `json:"notion_databases,omitempty"`
}
