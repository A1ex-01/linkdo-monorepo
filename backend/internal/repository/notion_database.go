package repository

import (
	"link-do-backend/internal/models"

	"gorm.io/gorm"
)

type NotionDatabaseRepository struct {
	db *gorm.DB
}

func NewNotionDatabaseRepository(db *gorm.DB) *NotionDatabaseRepository {
	return &NotionDatabaseRepository{db: db}
}

func (r *NotionDatabaseRepository) Create(nd *models.NotionDatabase) error {
	return r.db.Create(nd).Error
}

func (r *NotionDatabaseRepository) GetByID(id uint) (*models.NotionDatabase, error) {
	var nd models.NotionDatabase
	if err := r.db.First(&nd, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &nd, nil
}

func (r *NotionDatabaseRepository) GetByUUID(uuid string) (*models.NotionDatabase, error) {
	var nd models.NotionDatabase
	if err := r.db.Where("uuid = ?", uuid).First(&nd).Error; err != nil {
		return nil, err
	}
	return &nd, nil
}

func (r *NotionDatabaseRepository) GetByNotionDatabaseID(notionDBID string) (*models.NotionDatabase, error) {
	var nd models.NotionDatabase
	if err := r.db.Where("notion_database_id = ?", notionDBID).First(&nd).Error; err != nil {
		return nil, err
	}
	return &nd, nil
}

func (r *NotionDatabaseRepository) GetByCollectionID(collectionID uint) ([]*models.NotionDatabase, error) {
	var nds []*models.NotionDatabase
	if err := r.db.Where("collection_id = ?", collectionID).Find(&nds).Error; err != nil {
		return nil, err
	}
	return nds, nil
}

func (r *NotionDatabaseRepository) GetByCollectionUUID(collectionUUID string) ([]*models.NotionDatabase, error) {
	var nds []*models.NotionDatabase
	if err := r.db.Where("collection_uuid = ?", collectionUUID).Find(&nds).Error; err != nil {
		return nil, err
	}
	return nds, nil
}

func (r *NotionDatabaseRepository) GetAll() ([]*models.NotionDatabase, error) {
	var nds []*models.NotionDatabase
	if err := r.db.Find(&nds).Error; err != nil {
		return nil, err
	}
	return nds, nil
}

func (r *NotionDatabaseRepository) Update(nd *models.NotionDatabase) error {
	return r.db.Save(nd).Error
}

func (r *NotionDatabaseRepository) Delete(id uint) error {
	return r.db.Delete(&models.NotionDatabase{}, id).Error
}

func (r *NotionDatabaseRepository) DeleteByUUID(uuid string) error {
	return r.db.Where("uuid = ?", uuid).Delete(&models.NotionDatabase{}).Error
}

func (r *NotionDatabaseRepository) DeleteByCollectionID(collectionID uint) error {
	return r.db.Where("collection_id = ?", collectionID).Delete(&models.NotionDatabase{}).Error
}

func (r *NotionDatabaseRepository) DeleteByCollectionUUID(collectionUUID string) error {
	return r.db.Where("collection_uuid = ?", collectionUUID).Delete(&models.NotionDatabase{}).Error
}
