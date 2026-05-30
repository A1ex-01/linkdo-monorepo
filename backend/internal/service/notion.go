package service

import (
	"context"
	"encoding/json"
	"fmt"
	"link-do-backend/internal/config"
	"link-do-backend/internal/notion"
	"link-do-backend/internal/repository"

	"github.com/jomei/notionapi"
)

type NotionService struct {
	userRepo     *repository.UserRepository
	notionDBRepo *repository.NotionDatabaseRepository
}

func NewNotionService(userRepo *repository.UserRepository, notionDBRepo *repository.NotionDatabaseRepository) *NotionService {
	return &NotionService{userRepo: userRepo, notionDBRepo: notionDBRepo}
}

// CreateCollectionInNotion creates a Notion Database and returns the page ID
// This is called ONLY at creation time to get the Notion ID
func (s *NotionService) CreateCollectionInNotion(ctx context.Context, userID uint, name string) (pageID string, err error) {
	accessToken := s.getAccessToken(userID)
	if accessToken == "" {
		return "", fmt.Errorf("notion access token not configured")
	}

	nc := notion.NewClient(accessToken)
	db, err := nc.CreateDatabase(ctx, name)
	if err != nil {
		return "", fmt.Errorf("failed to create Notion database: %w", err)
	}
	return db.ID.String(), nil
}

// CreateTaskInNotion creates a Notion Page and returns the page ID
// This is called ONLY at creation time to get the Notion ID
func (s *NotionService) CreateTaskInNotion(ctx context.Context, userID uint, collectionNotionDBID, title, appStatus string) (pageID string, err error) {
	accessToken := s.getAccessToken(userID)
	if accessToken == "" {
		return "", fmt.Errorf("notion access token not configured")
	}

	nc := notion.NewClient(accessToken)
	notionStatus := s.mapToNotionStatus(appStatus, nil, collectionNotionDBID)
	if notionStatus == "" {
		notionStatus = "未开始"
	}
	page, err := nc.CreatePage(ctx, collectionNotionDBID, title, notionStatus)
	if err != nil {
		return "", fmt.Errorf("failed to create Notion page: %w", err)
	}
	return page.ID.String(), nil
}

// SyncTaskStatusToNotion updates the status of a task in Notion
// This is optional sync - errors are logged but not blocking
func (s *NotionService) SyncTaskStatusToNotion(ctx context.Context, userID uint, taskNotionPageID string, appStatus string, notionDatabaseID *uint) error {
	accessToken := s.getAccessToken(userID)
	if accessToken == "" {
		return fmt.Errorf("notion access token not configured")
	}

	// Map app status to Notion status using dynamic mapping
	notionStatus := s.mapToNotionStatus(appStatus, notionDatabaseID, "")

	nc := notion.NewClient(accessToken)
	return nc.UpdatePageStatus(ctx, taskNotionPageID, notionStatus)
}

// mapToNotionStatus converts app status to Notion status using dynamic mapping
// appStatus: backlog, this_week, today, done
// notionDatabaseID: used to look up the mapping (can be nil if notionDBID is provided)
// notionDBID: alternative to notionDatabaseID (direct Notion database ID string)
func (s *NotionService) mapToNotionStatus(appStatus string, notionDatabaseID *uint, notionDBID string) string {
	// Try to get dynamic mapping from database
	var ndID uint
	if notionDatabaseID != nil {
		ndID = *notionDatabaseID
	}
	if notionDBID != "" && s.notionDBRepo != nil {
		nd, err := s.notionDBRepo.GetByNotionDatabaseID(notionDBID)
		if err == nil {
			ndID = nd.ID
		}
	}
	if ndID > 0 && s.notionDBRepo != nil {
		nd, err := s.notionDBRepo.GetByID(ndID)
		if err == nil && nd.StatusMapping != "" && nd.StatusMapping != "{}" {
			var mapping map[string]string
			if err := json.Unmarshal([]byte(nd.StatusMapping), &mapping); err == nil {
				// Forward mapping: app status -> [notion statuses]
				if notionStatuses, ok := mapping[appStatus]; ok {
					return notionStatuses // Use first mapped Notion status
				}
			}
		}
	}

	// Fallback to default mapping
	return defaultNotionStatus(appStatus)
}

func defaultNotionStatus(status string) string {
	switch status {
	case "backlog":
		return "未开始"
	case "this_week", "today":
		return "进行中"
	case "done":
		return "完成"
	default:
		return "未开始"
	}
}

// GetDatabase fetches a Notion database by its ID
func (s *NotionService) GetDatabase(ctx context.Context, userID uint, databaseID string) (*notionapi.Database, error) {
	accessToken := s.getAccessToken(userID)
	if accessToken == "" {
		return nil, fmt.Errorf("notion access token not configured")
	}

	nc := notion.NewClient(accessToken)
	return nc.GetDatabase(ctx, databaseID)
}

// SearchDatabases searches for Notion databases accessible by the user
func (s *NotionService) SearchDatabases(ctx context.Context, userID uint, query string) ([]*notion.SearchResult, error) {
	accessToken := s.getAccessToken(userID)
	if accessToken == "" {
		return nil, fmt.Errorf("notion access token not configured")
	}

	nc := notion.NewClient(accessToken)
	return nc.SearchDatabases(ctx, query)
}

func (s *NotionService) getAccessToken(userID uint) string {
	cfg := config.Get()
	// Try to get per-user token from database
	if s.userRepo != nil && userID > 0 {
		user, err := s.userRepo.GetByID(userID)
		if err == nil && user.NotionAccessToken != "" {
			return user.NotionAccessToken
		}
	}
	// Fallback to global token
	return cfg.NotionAccessToken
}

func (s *NotionService) getAccessTokenByUUID(userUUID string) string {
	cfg := config.Get()
	if s.userRepo != nil && userUUID != "" {
		user, err := s.userRepo.GetByUUID(userUUID)
		if err == nil && user.NotionAccessToken != "" {
			return user.NotionAccessToken
		}
	}
	return cfg.NotionAccessToken
}
