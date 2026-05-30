package repository

import (
	"link-do-backend/internal/models"
	"time"

	"gorm.io/gorm"
)

type TimerRepository struct {
	db *gorm.DB
}

func NewTimerRepository(db *gorm.DB) *TimerRepository {
	return &TimerRepository{db: db}
}

func (r *TimerRepository) Create(session *models.TimeSession) error {
	return r.db.Create(session).Error
}

func (r *TimerRepository) GetByID(id uint) (*models.TimeSession, error) {
	var session models.TimeSession
	if err := r.db.First(&session, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *TimerRepository) GetTimersByTaskId(taskId uint) ([]*models.TimeSession, error) {
	var sessions []*models.TimeSession
	if err := r.db.Where("task_id = ?", taskId).Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *TimerRepository) GetByUUID(uuid string) (*models.TimeSession, error) {
	var session models.TimeSession
	if err := r.db.Where("uuid = ?", uuid).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *TimerRepository) GetByTaskID(taskID uint) (*models.TimeSession, error) {
	var session models.TimeSession
	if err := r.db.Where("task_id = ?", taskID).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *TimerRepository) GetActiveByTaskID(taskID uint) (*models.TimeSession, error) {
	var session models.TimeSession
	if err := r.db.Where("task_id = ? AND ended_at IS NULL", taskID).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *TimerRepository) GetActiveByTaskUUID(taskUUID string) (*models.TimeSession, error) {
	var session models.TimeSession
	if err := r.db.Where("task_uuid = ? AND ended_at IS NULL", taskUUID).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *TimerRepository) GetActiveSession() (*models.TimeSession, error) {
	var session models.TimeSession
	if err := r.db.Where("ended_at IS NULL").First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *TimerRepository) StopSession(id uint, endedAt time.Time, duration int) error {
	return r.db.Model(&models.TimeSession{}).Where("id = ?", id).Updates(map[string]interface{}{
		"ended_at": endedAt,
		"duration": duration,
	}).Error
}

func (r *TimerRepository) StopSessionByUUID(uuid string, endedAt time.Time, duration int) error {
	return r.db.Model(&models.TimeSession{}).Where("uuid = ?", uuid).Updates(map[string]interface{}{
		"ended_at": endedAt,
		"duration": duration,
	}).Error
}
