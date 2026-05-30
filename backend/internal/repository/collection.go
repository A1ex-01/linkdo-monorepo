package repository

import (
	"link-do-backend/internal/models"

	"gorm.io/gorm"
)

type CollectionRepository struct {
	db *gorm.DB
}

func NewCollectionRepository(db *gorm.DB) *CollectionRepository {
	return &CollectionRepository{db: db}
}

func (r *CollectionRepository) Create(c *models.Collection) error {
	return r.db.Create(c).Error
}

func (r *CollectionRepository) GetByID(id uint) (*models.Collection, error) {
	var c models.Collection
	if err := r.db.First(&c, id).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CollectionRepository) GetByUUID(uuid string) (*models.Collection, error) {
	var c models.Collection
	if err := r.db.Where("uuid = ?", uuid).First(&c).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CollectionRepository) GetByIDAndUserID(id, userID uint) (*models.Collection, error) {
	var c models.Collection
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&c).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CollectionRepository) GetByUUIDAndUserID(uuid string, userID uint) (*models.Collection, error) {
	var c models.Collection
	if err := r.db.Where("uuid = ? AND user_id = ?", uuid, userID).First(&c).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CollectionRepository) GetAll() ([]*models.Collection, error) {
	var collections []*models.Collection
	if err := r.db.Find(&collections).Error; err != nil {
		return nil, err
	}
	return collections, nil
}

func (r *CollectionRepository) GetAllByUserID(userID uint) ([]*models.Collection, error) {
	var collections []*models.Collection
	if err := r.db.Where("user_id = ?", userID).Find(&collections).Error; err != nil {
		return nil, err
	}
	return collections, nil
}

func (r *CollectionRepository) Update(c *models.Collection) error {
	return r.db.Save(c).Error
}

func (r *CollectionRepository) Delete(id uint) error {
	return r.db.Delete(&models.Collection{}, id).Error
}

func (r *CollectionRepository) DeleteByIDAndUserID(id, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Collection{}).Error
}

func (r *CollectionRepository) DeleteByUUIDAndUserID(uuid string, userID uint) error {
	return r.db.Where("uuid = ? AND user_id = ?", uuid, userID).Delete(&models.Collection{}).Error
}

func (r *CollectionRepository) SetNotionID(id uint, pageID, notionUUID string) error {
	return r.db.Model(&models.Collection{}).Where("id = ?", id).Updates(map[string]interface{}{
		"notion_page_id": pageID,
		"notion_uuid":    notionUUID,
	}).Error
}
