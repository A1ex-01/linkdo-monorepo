package notion

import (
	"context"
	"github.com/jomei/notionapi"
)

// SearchResult represents a search result from Notion
type SearchResult struct {
	Object     string `json:"object"`
	ID         string `json:"id"`
	Type       string `json:"type,omitempty"`
	Title      string `json:"title,omitempty"`
	Icon       string `json:"icon,omitempty"`
	DatabaseID string `json:"database_id,omitempty"`
}

// SearchDatabases searches for databases accessible by the user
func (c *Client) SearchDatabases(ctx context.Context, query string) ([]*SearchResult, error) {
	resp, err := c.client.Search.Do(ctx, &notionapi.SearchRequest{
		Query: query,
		Filter: notionapi.SearchFilter{
			Value:    "database",
			Property: "object",
		},
	})
	if err != nil {
		return nil, err
	}

	results := make([]*SearchResult, 0, len(resp.Results))
	for _, obj := range resp.Results {
		var sr *SearchResult

		switch v := obj.(type) {
		case *notionapi.Page:
			// Page can be a database item if it has Type == "database_id"
			if v.Parent.Type == "database_id" {
				sr = &SearchResult{
					Object:     "page",
					ID:         v.ID.String(),
					DatabaseID: v.Parent.DatabaseID.String(),
				}
				if v.Icon != nil && v.Icon.Emoji != nil {
					sr.Icon = string(*v.Icon.Emoji)
				}
				// Try to get title from properties
				if titleProp, ok := v.Properties["title"]; ok {
					if tp, ok := titleProp.(*notionapi.TitleProperty); ok && len(tp.Title) > 0 {
						sr.Title = tp.Title[0].PlainText
					}
				}
			}
		case *notionapi.Database:
			sr = &SearchResult{
				Object:     "database",
				ID:         v.ID.String(),
				DatabaseID: v.ID.String(),
			}
			if v.Icon != nil && v.Icon.Emoji != nil {
				sr.Icon = string(*v.Icon.Emoji)
			}
			if len(v.Title) > 0 {
				sr.Title = v.Title[0].PlainText
			}
		}

		if sr != nil {
			results = append(results, sr)
		}
	}
	return results, nil
}
