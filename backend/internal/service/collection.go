package service

import (
	"context"
	"link-do-backend/internal/models"
	"link-do-backend/internal/repository"
	"link-do-backend/internal/utils"
)

type CollectionService struct {
	repo      *repository.CollectionRepository
	taskRepo  *repository.TaskRepository
	notionSvc *NotionService
}

func NewCollectionService(repo *repository.CollectionRepository, taskRepo *repository.TaskRepository, notionSvc *NotionService) *CollectionService {
	return &CollectionService{repo: repo, taskRepo: taskRepo, notionSvc: notionSvc}
}

func (s *CollectionService) List(userID uint) ([]*models.Collection, error) {
	return s.repo.GetAllByUserID(userID)
}

func (s *CollectionService) GetByID(id, userID uint) (*models.Collection, error) {
	return s.repo.GetByIDAndUserID(id, userID)
}

func (s *CollectionService) GetByUUID(uuid string, userID uint) (*models.Collection, error) {
	return s.repo.GetByUUIDAndUserID(uuid, userID)
}

func (s *CollectionService) Create(ctx context.Context, userID uint, name, icon string) (*models.Collection, error) {
	col := &models.Collection{
		UUID:   utils.NewCollectionUUID(),
		UserID: userID,
		Name:   name,
		Icon:   icon,
	}
	if err := s.repo.Create(col); err != nil {
		return nil, err
	}
	// Try to create Notion page and bind ID (non-blocking for MVP)
	if s.notionSvc != nil {
		pageID, err := s.notionSvc.CreateCollectionInNotion(ctx, 0, name)
		if err == nil && pageID != "" {
			s.repo.SetNotionID(col.ID, pageID, "")
		}
	}
	return col, nil
}

func (s *CollectionService) Update(uuid string, userID uint, name, icon string, archived bool) error {
	col, err := s.repo.GetByUUIDAndUserID(uuid, userID)
	if err != nil {
		return err
	}
	if name != "" {
		col.Name = name
	}
	if icon != "" {
		col.Icon = icon
	}
	col.IsArchived = archived
	return s.repo.Update(col)
}

func (s *CollectionService) Delete(uuid string, userID uint) error {
	return s.repo.DeleteByUUIDAndUserID(uuid, userID)
}
