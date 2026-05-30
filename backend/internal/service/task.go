package service

import (
	"context"
	"encoding/json"
	"fmt"
	"link-do-backend/internal/models"
	"link-do-backend/internal/repository"
	"link-do-backend/internal/utils"
)

type TaskService struct {
	repo           *repository.TaskRepository
	collectionRepo *repository.CollectionRepository
	notionDBSvc    *NotionDatabaseService
	notionSvc      *NotionService
}

func NewTaskService(repo *repository.TaskRepository, collectionRepo *repository.CollectionRepository, notionDBSvc *NotionDatabaseService, notionSvc *NotionService) *TaskService {
	return &TaskService{repo: repo, collectionRepo: collectionRepo, notionDBSvc: notionDBSvc, notionSvc: notionSvc}
}

func (s *TaskService) List(collectionUUID string) ([]*models.Task, error) {
	return s.repo.GetByCollectionUUID(collectionUUID)
}

func (s *TaskService) Create(ctx context.Context, collectionUUID string, notionDatabaseUUID *string, title string, estimatedTime int,
	status models.TaskStatus,
) (*models.Task, error) {
	// Get collection by UUID to get internal ID
	collection, err := s.collectionRepo.GetByUUID(collectionUUID)
	if err != nil {
		return nil, fmt.Errorf("collection not found")
	}

	// If no specific DB requested, return error - user must choose a DB
	var notionDBID *uint
	if notionDatabaseUUID == nil && s.notionDBSvc != nil {
		return nil, fmt.Errorf("please select a Notion database")
	}

	// validate mapping status
	var mapping map[string]string
	if notionDatabaseUUID != nil && s.notionDBSvc != nil {
		nd, err := s.notionDBSvc.GetByUUID(*notionDatabaseUUID)
		if err == nil && nd != nil {

			if nd.StatusMapping != "" && nd.StatusMapping != "{}" {
				json.Unmarshal([]byte(nd.StatusMapping), &mapping)
			} else {
				return nil, fmt.Errorf("status mapping is empty")
			}
		} else {
			return nil, fmt.Errorf("failed to get status mapping")
		}
	}

	// Get Notion database internal ID from UUID
	var notionDBInternalID string
	if notionDatabaseUUID != nil && s.notionDBSvc != nil {
		nd, err := s.notionDBSvc.GetByUUID(*notionDatabaseUUID)
		if err == nil && nd != nil {
			notionDBID = &nd.ID
			notionDBInternalID = nd.NotionDatabaseID
		} else {
			return nil, fmt.Errorf("please select a Notion database")
		}
	}

	// Create task in Notion
	var notionPageID string
	if notionDBInternalID != "" && s.notionSvc != nil {
		var userId = ctx.Value("userID").(uint)
		pageID, err := s.notionSvc.CreateTaskInNotion(ctx, userId, notionDBInternalID, title, string(status))
		if err == nil {
			notionPageID = pageID
		} else {
			return nil, fmt.Errorf("failed to create task in Notion: %w", err)
		}
	}

	// Create task in database
	task := &models.Task{
		UUID:               utils.NewTaskUUID(),
		CollectionID:       collection.ID,
		CollectionUUID:     collectionUUID,
		NotionDatabaseID:   notionDBID,
		NotionDatabaseUUID: notionDatabaseUUID,
		Title:              title,
		EstimatedTime:      estimatedTime,
		Status:             status,
	}
	if notionPageID != "" {
		task.NotionPageID = &notionPageID
	} else {
		return nil, fmt.Errorf("failed to create task in Notion")
	}
	if err := s.repo.Create(task); err != nil {
		return nil, err
	}

	return task, nil
}

func (s *TaskService) GetByID(id uint) (*models.Task, error) {
	return s.repo.GetByID(id)
}

func (s *TaskService) GetByUUID(uuid string) (*models.Task, error) {
	return s.repo.GetByUUID(uuid)
}

func (s *TaskService) GetByCollectionID(collectionID uint) ([]*models.Task, error) {
	return s.repo.GetByCollectionID(collectionID)
}

func (s *TaskService) GetByCollectionUUID(collectionUUID string) ([]*models.Task, error) {
	return s.repo.GetByCollectionUUID(collectionUUID)
}

func (s *TaskService) Update(uuid string, title string, estimatedTime int) error {
	task, err := s.repo.GetByUUID(uuid)
	if err != nil {
		return err
	}
	if title != "" {
		task.Title = title
	}
	if estimatedTime >= 0 {
		task.EstimatedTime = estimatedTime
	}
	return s.repo.Update(task)
}

func (s *TaskService) UpdateStatus(ctx context.Context, uuid string, status models.TaskStatus) error {
	task, err := s.repo.GetByUUID(uuid)
	if err != nil {
		return err
	}
	if err := s.repo.UpdateStatusByUUID(uuid, status); err != nil {
		return err
	}
	// Sync status to Notion if page ID exists (non-blocking)
	if task.NotionPageID != nil && *task.NotionPageID != "" && s.notionSvc != nil {
		var userId = ctx.Value("userID").(uint)
		_ = s.notionSvc.SyncTaskStatusToNotion(ctx, userId, *task.NotionPageID, string(status), task.NotionDatabaseID)
	}
	return nil
}

func (s *TaskService) Delete(uuid string) error {
	return s.repo.DeleteByUUID(uuid)
}

func (s *TaskService) BindNotionID(id uint, pageID, notionUUID string) error {
	return s.repo.SetNotionID(id, pageID, notionUUID)
}

func (s *TaskService) IncrementActualTime(id uint, minutes int) error {
	return s.repo.IncrementActualTime(id, minutes)
}
