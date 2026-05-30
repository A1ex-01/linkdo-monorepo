package notion

import (
	"context"
	"fmt"

	"github.com/jomei/notionapi"
)

func (c *Client) CreatePage(ctx context.Context, dbID, title, status string) (*notionapi.Page, error) {
	parent := notionapi.Parent{
		Type:       notionapi.ParentTypeDatabaseID,
		DatabaseID: notionapi.DatabaseID(dbID),
	}
	// 动态获取 fieldName
	var nameFieldName = ""
	var statusFieldName = ""
	var dbProperties, err = c.client.Database.Get(ctx, notionapi.DatabaseID(dbID))
	if err != nil {
		return nil, err
	}
	for _, property := range dbProperties.Properties {
		if property.GetType() == notionapi.PropertyConfigTypeTitle && nameFieldName == "" {
			nameFieldName = property.GetID().String()
		}
		if property.GetType() == notionapi.PropertyConfigType(notionapi.PropertyTypeStatus) && statusFieldName == "" {
			statusFieldName = property.GetID().String()
		}
	}

	if nameFieldName == "" || statusFieldName == "" {
		return nil, fmt.Errorf("name field or status field not found")
	}

	props := notionapi.Properties{
		nameFieldName: &notionapi.TitleProperty{
			Title: []notionapi.RichText{
				{
					Type: "text",
					Text: &notionapi.Text{
						Content: title,
					},
					PlainText: title,
				},
			},
		},
		statusFieldName: &notionapi.StatusProperty{
			Status: notionapi.Status{Name: status},
		},
	}
	req := &notionapi.PageCreateRequest{
		Parent:     parent,
		Properties: props,
	}
	return c.client.Page.Create(ctx, req)
}

func (c *Client) UpdatePageStatus(ctx context.Context, pageID, status string) error {
	props := notionapi.Properties{
		"状态": &notionapi.StatusProperty{
			Status: notionapi.Status{Name: status},
		},
	}
	_, err := c.client.Page.Update(ctx, notionapi.PageID(pageID), &notionapi.PageUpdateRequest{
		Properties: props,
	})
	return err
}

func (c *Client) UpdatePageTime(ctx context.Context, pageID string, actualMinutes int) error {
	props := notionapi.Properties{
		"Actual (min)": &notionapi.NumberProperty{
			Number: float64(actualMinutes),
		},
	}
	_, err := c.client.Page.Update(ctx, notionapi.PageID(pageID), &notionapi.PageUpdateRequest{
		Properties: props,
	})
	return err
}
