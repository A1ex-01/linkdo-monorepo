package types

type Task struct {
	ID               string  `json:"id"`
	CollectionID     string  `json:"collection_id"`
	NotionDatabaseID string  `json:"notion_database_id,omitempty"`
	Title            string  `json:"title"`
	Status           string  `json:"status"` // backlog, this_week, today, done
	EstimatedTime    int     `json:"estimated_time"` // minutes
	ActualTime       int     `json:"actual_time"` // minutes (cumulative)
	Source           string  `json:"source"` // always "notion"
	NotionPageID     string  `json:"notion_page_id"`
	CompletedAt      *int64  `json:"completed_at,omitempty"` // unix timestamp
	CreatedAt        int64   `json:"created_at"`
	SortOrder        int     `json:"sort_order"`
}
