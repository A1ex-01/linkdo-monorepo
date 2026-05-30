package repository

import (
	"link-do-backend/internal/models"
	"time"

	"gorm.io/gorm"
)

type TaskRepository struct {
	db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) *TaskRepository {
	return &TaskRepository{db: db}
}

func (r *TaskRepository) Create(t *models.Task) error {
	return r.db.Create(t).Error
}

func (r *TaskRepository) GetByID(id uint) (*models.Task, error) {
	var t models.Task
	if err := r.db.First(&t, id).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TaskRepository) GetByUUID(uuid string) (*models.Task, error) {
	var t models.Task
	if err := r.db.Where("uuid = ?", uuid).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TaskRepository) GetByCollectionID(collectionID uint) ([]*models.Task, error) {
	var tasks []*models.Task
	if err := r.db.Where("collection_id = ?", collectionID).Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *TaskRepository) GetByCollectionUUID(collectionUUID string) ([]*models.Task, error) {
	var tasks []*models.Task
	if err := r.db.Where("collection_uuid = ?", collectionUUID).Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *TaskRepository) Update(t *models.Task) error {
	return r.db.Save(t).Error
}

func (r *TaskRepository) UpdateStatus(id uint, status models.TaskStatus) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if status == models.StatusDone {
		now := time.Now()
		updates["completed_at"] = &now
	}
	return r.db.Model(&models.Task{}).Where("id = ?", id).Updates(updates).Error
}

func (r *TaskRepository) UpdateStatusByUUID(uuid string, status models.TaskStatus) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if status == models.StatusDone {
		now := time.Now()
		updates["completed_at"] = &now
	}
	return r.db.Model(&models.Task{}).Where("uuid = ?", uuid).Updates(updates).Error
}

func (r *TaskRepository) Delete(id uint) error {
	return r.db.Delete(&models.Task{}, id).Error
}

func (r *TaskRepository) DeleteByUUID(uuid string) error {
	return r.db.Where("uuid = ?", uuid).Delete(&models.Task{}).Error
}

func (r *TaskRepository) SetNotionID(id uint, pageID, notionUUID string) error {
	return r.db.Model(&models.Task{}).Where("id = ?", id).Updates(map[string]interface{}{
		"notion_page_id": pageID,
		"notion_uuid":    notionUUID,
	}).Error
}

func (r *TaskRepository) IncrementActualTime(id uint, minutes int) error {
	return r.db.Model(&models.Task{}).Where("id = ?", id).Update("actual_time", gorm.Expr("actual_time + ?", minutes)).Error
}
