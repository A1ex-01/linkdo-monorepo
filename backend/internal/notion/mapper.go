package notion

import (
    "github.com/jomei/notionapi"
    "link-do-backend/internal/types"
)

func CollectionFromDatabase(db *notionapi.Database) *types.Collection {
    name := ""
    icon := ""
    if len(db.Title) > 0 {
        name = db.Title[0].PlainText
    }
    if db.Icon != nil {
        if db.Icon.Type == "emoji" && db.Icon.Emoji != nil {
            icon = string(*db.Icon.Emoji)
        }
    }
    return &types.Collection{
        ID:             db.ID.String(),
        Name:           name,
        Icon:           icon,
        Source:         "notion",
        PendingCount:   0,
        EstimatedTotal: 0,
        Archived:       false,
    }
}

func TaskFromPage(page *notionapi.Page, collectionID string) *types.Task {
    title := ""
    status := "backlog"
    estTime := 0
    actualTime := 0
    for name, prop := range page.Properties {
        switch p := prop.(type) {
        case *notionapi.TitleProperty:
            if len(p.Title) > 0 {
                title = p.Title[0].PlainText
            }
        case *notionapi.StatusProperty:
            if p.Status.Name != "" {
                switch p.Status.Name {
                case "This Week":
                    status = "this_week"
                case "Today":
                    status = "today"
                case "Done":
                    status = "done"
                default:
                    status = "backlog"
                }
            }
            _ = name
        case *notionapi.NumberProperty:
            if name == "Estimate (min)" {
                estTime = int(p.Number)
            } else if name == "Actual (min)" {
                actualTime = int(p.Number)
            }
        }
    }
    return &types.Task{
        ID:            page.ID.String(),
        CollectionID:  collectionID,
        Title:         title,
        Status:        status,
        EstimatedTime: estTime,
        ActualTime:    actualTime,
        Source:        "notion",
        NotionPageID:  page.ID.String(),
        CompletedAt:   nil,
        CreatedAt:     page.CreatedTime.Unix(),
        SortOrder:     0,
    }
}
