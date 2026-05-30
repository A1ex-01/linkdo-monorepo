package notion

import (
    "context"
    "github.com/jomei/notionapi"
)

func (c *Client) CreateDatabase(ctx context.Context, name string) (*notionapi.Database, error) {
    title := []notionapi.RichText{
        {PlainText: name},
    }
    props := notionapi.PropertyConfigs{
        "Name": &notionapi.TitlePropertyConfig{
            Type:  notionapi.PropertyConfigTypeTitle,
            Title: struct{}{},
        },
        "Status": &notionapi.StatusPropertyConfig{
            Type: notionapi.PropertyConfigStatus,
            Status: notionapi.StatusConfig{
                Options: []notionapi.Option{
                    {Name: "Backlog"},
                    {Name: "This Week"},
                    {Name: "Today"},
                    {Name: "Done"},
                },
            },
        },
        "Estimate (min)": &notionapi.NumberPropertyConfig{
            Type: notionapi.PropertyConfigTypeNumber,
            Number: notionapi.NumberFormat{
                Format: notionapi.FormatNumber,
            },
        },
        "Actual (min)": &notionapi.NumberPropertyConfig{
            Type: notionapi.PropertyConfigTypeNumber,
            Number: notionapi.NumberFormat{
                Format: notionapi.FormatNumber,
            },
        },
    }
    parent := notionapi.Parent{
        Type:      notionapi.ParentTypeWorkspace,
        Workspace: true,
    }
    req := &notionapi.DatabaseCreateRequest{
        Parent:     parent,
        Title:      title,
        Properties: props,
        IsInline:   false,
    }
    return c.client.Database.Create(ctx, req)
}

func (c *Client) GetDatabase(ctx context.Context, dbID string) (*notionapi.Database, error) {
    return c.client.Database.Get(ctx, notionapi.DatabaseID(dbID))
}

func (c *Client) QueryDatabase(ctx context.Context, dbID string) ([]*notionapi.Page, error) {
    resp, err := c.client.Database.Query(ctx, notionapi.DatabaseID(dbID), &notionapi.DatabaseQueryRequest{})
    if err != nil {
        return nil, err
    }
    pages := make([]*notionapi.Page, 0, len(resp.Results))
    for _, p := range resp.Results {
        page := p
        pages = append(pages, &page)
    }
    return pages, nil
}
