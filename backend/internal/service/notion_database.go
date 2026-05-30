package service

import (
	"context"
	"encoding/json"
	"fmt"
	"link-do-backend/internal/models"
	"link-do-backend/internal/repository"
	"link-do-backend/internal/utils"

	"github.com/jomei/notionapi"
)

type NotionDatabaseService struct {
	repo           *repository.NotionDatabaseRepository
	collectionRepo *repository.CollectionRepository
	notionSvc      *NotionService
}

func NewNotionDatabaseService(repo *repository.NotionDatabaseRepository, collectionRepo *repository.CollectionRepository, notionSvc *NotionService) *NotionDatabaseService {
	return &NotionDatabaseService{repo: repo, collectionRepo: collectionRepo, notionSvc: notionSvc}
}

func (s *NotionDatabaseService) Create(ctx context.Context, collectionUUID string, notionDatabaseID, name, icon string) (*models.NotionDatabase, error) {
	collection, err := s.collectionRepo.GetByUUID(collectionUUID)
	if err != nil {
		return nil, fmt.Errorf("collection not found")
	}
	nd := &models.NotionDatabase{
		UUID:             utils.NewNotionDatabaseUUID(),
		CollectionUUID:   collectionUUID,
		CollectionID:     collection.ID,
		NotionDatabaseID: notionDatabaseID,
		Name:             name,
		Icon:             icon,
		StatusMapping:    "{}", // default empty mapping
	}
	if err := s.repo.Create(nd); err != nil {
		return nil, err
	}
	return nd, nil
}

func (s *NotionDatabaseService) GetByID(id uint) (*models.NotionDatabase, error) {
	return s.repo.GetByID(id)
}

func (s *NotionDatabaseService) GetByUUID(uuid string) (*models.NotionDatabase, error) {
	return s.repo.GetByUUID(uuid)
}

func (s *NotionDatabaseService) GetByNotionDatabaseID(notionDBID string) (*models.NotionDatabase, error) {
	return s.repo.GetByNotionDatabaseID(notionDBID)
}

func (s *NotionDatabaseService) GetByCollectionID(collectionID uint) ([]*models.NotionDatabase, error) {
	return s.repo.GetByCollectionID(collectionID)
}

func (s *NotionDatabaseService) GetByCollectionUUID(collectionUUID string) ([]*models.NotionDatabase, error) {
	return s.repo.GetByCollectionUUID(collectionUUID)
}

func (s *NotionDatabaseService) GetAll() ([]*models.NotionDatabase, error) {
	return s.repo.GetAll()
}

func (s *NotionDatabaseService) Update(uuid string, name, icon string) error {
	nd, err := s.repo.GetByUUID(uuid)
	if err != nil {
		return err
	}
	if name != "" {
		nd.Name = name
	}
	if icon != "" {
		nd.Icon = icon
	}
	return s.repo.Update(nd)
}

// StatusMappingResult holds the status options and current mapping
type StatusMappingResult struct {
	Mapping map[string]string `json:"mapping"`
}

// GetStatusMapping returns the current status mapping along with available Notion options
func (s *NotionDatabaseService) GetStatusMapping(uuid string) (*StatusMappingResult, error) {
	nd, err := s.repo.GetByUUID(uuid)
	if err != nil {
		return nil, err
	}

	var mapping map[string]string
	if nd.StatusMapping != "" {
		json.Unmarshal([]byte(nd.StatusMapping), &mapping)
	}
	if mapping == nil {
		mapping = make(map[string]string)
	}

	return &StatusMappingResult{
		Mapping: mapping,
	}, nil
}

// UpdateStatusMapping updates the full status mapping
func (s *NotionDatabaseService) UpdateStatusMapping(uuid string, mapping map[string]string) error {
	nd, err := s.repo.GetByUUID(uuid)
	if err != nil {
		return err
	}
	mappingJSON, err := json.Marshal(mapping)
	if err != nil {
		return err
	}
	nd.StatusMapping = string(mappingJSON)
	return s.repo.Update(nd)
}

// FetchStatusOptions fetches status options from Notion and stores them (but not the mapping)
func (s *NotionDatabaseService) FetchStatusOptions(ctx context.Context, uuid string, userID uint) ([]string, error) {
	nd, err := s.repo.GetByUUID(uuid)
	if err != nil {
		return nil, err
	}

	// Fetch database schema from Notion to get status options
	db, err := s.notionSvc.GetDatabase(ctx, userID, nd.NotionDatabaseID)
	if err != nil {
		return nil, err
	}

	// Extract status options from database properties
	// Check Status, Select, and MultiSelect property types
	var options []string
	if db.Properties != nil {
		for _, prop := range db.Properties {
			var opts []notionapi.Option
			switch p := prop.(type) {
			case *notionapi.StatusPropertyConfig:
				opts = p.Status.Options
			case *notionapi.SelectPropertyConfig:
				opts = p.Select.Options
			case *notionapi.MultiSelectPropertyConfig:
				opts = p.MultiSelect.Options
			}
			if len(opts) > 0 && len(options) == 0 {
				for _, o := range opts {
					options = append(options, o.Name)
				}
				break // Use the first property that has options
			}
		}
	}

	// Store the notion options on the model (for later retrieval without re-fetching)
	nd.NotionOptions = options
	if err := s.repo.Update(nd); err != nil {
		return nil, err
	}

	return options, nil
}

// GetNotionStatusForAppStatus returns the first Notion status that maps to the given app status
// Returns empty string if no mapping exists
func (s *NotionDatabaseService) GetNotionStatusForAppStatus(id uint, appStatus string) (string, error) {
	nd, err := s.repo.GetByID(id)
	if err != nil {
		return "", err
	}
	var mapping map[string][]string
	if nd.StatusMapping != "" {
		json.Unmarshal([]byte(nd.StatusMapping), &mapping)
	}
	if mapping == nil {
		return "", nil
	}
	notionStatuses := mapping[appStatus]
	if len(notionStatuses) > 0 {
		return notionStatuses[0], nil
	}
	return "", nil
}

func (s *NotionDatabaseService) Delete(uuid string) error {
	return s.repo.DeleteByUUID(uuid)
}
