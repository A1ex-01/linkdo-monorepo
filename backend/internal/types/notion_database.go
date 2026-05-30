package types

// NotionDatabase represents a Notion database associated with a Collection
type NotionDatabase struct {
    ID               string            `json:"id"`
    CollectionID     string            `json:"collection_id"`
    NotionDatabaseID string            `json:"notion_database_id"`
    Name             string            `json:"name"`
    Icon             string            `json:"icon"`
    StatusMapping    map[string]string `json:"status_mapping"` // notion_status -> app_status
    CreatedAt        int64             `json:"created_at"`
    UpdatedAt        int64             `json:"updated_at"`
}
