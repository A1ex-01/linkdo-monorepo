package service

import (
	"context"
	"fmt"
	"link-do-backend/internal/notion"
	"link-do-backend/internal/repository"
	"link-do-backend/internal/store"
)

type SyncService struct {
	notionDBRepo *repository.NotionDatabaseRepository
}

func NewSyncService(notionDBRepo *repository.NotionDatabaseRepository) *SyncService {
	return &SyncService{notionDBRepo: notionDBRepo}
}

func (s *SyncService) FullSync(ctx context.Context, userToken string) error {
	accessToken := store.New().GetNotionToken(userToken)
	if accessToken == "" {
		return fmt.Errorf("not authenticated")
	}
	nc := notion.NewClient(accessToken)

	// Get all Notion databases
	notionDBs, err := s.notionDBRepo.GetAll()
	if err != nil {
		return err
	}

	for _, nd := range notionDBs {
		pages, err := nc.QueryDatabase(ctx, nd.NotionDatabaseID)
		if err != nil {
			continue
		}
		for _, page := range pages {
			task := notion.TaskFromPage(page, fmt.Sprintf("%d", nd.CollectionID))
			store.New().SetTask(task)
		}
	}
	return nil
}
