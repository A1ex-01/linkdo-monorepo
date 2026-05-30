package service

import (
	"fmt"
	"link-do-backend/internal/models"
	"link-do-backend/internal/repository"
	"link-do-backend/internal/utils"
	"time"
)

type TimerService struct {
	timerRepo *repository.TimerRepository
	taskRepo  *repository.TaskRepository
}

func NewTimerService(timerRepo *repository.TimerRepository, taskRepo *repository.TaskRepository) *TimerService {
	return &TimerService{timerRepo: timerRepo, taskRepo: taskRepo}
}

func (s *TimerService) Start(taskUUID string) (*models.TimeSession, error) {
	task, err := s.taskRepo.GetByUUID(taskUUID)
	if err != nil {
		return nil, fmt.Errorf("task not found")
	}
	session := &models.TimeSession{
		UUID:      utils.NewTimeSessionUUID(),
		TaskID:    task.ID,
		TaskUUID:  task.UUID,
		StartedAt: time.Now(),
	}
	if err := s.timerRepo.Create(session); err != nil {
		return nil, err
	}
	// return 前 把历史的也带上
	var historySessions []*models.TimeSession
	historySessions, err = s.timerRepo.GetTimersByTaskId(task.ID)
	if err != nil {
		return nil, err
	}
	totalDuration := 0
	for _, hs := range historySessions {
		totalDuration += hs.Duration
	}
	session.Duration = totalDuration
	return session, nil
}

func (s *TimerService) Stop(taskUUID string) error {
	session, err := s.timerRepo.GetActiveByTaskUUID(taskUUID)
	if err != nil {
		return fmt.Errorf("no active timer for this task")
	}
	endedAt := time.Now()
	duration := int(endedAt.Sub(session.StartedAt).Seconds())
	if err := s.timerRepo.StopSession(session.ID, endedAt, duration); err != nil {
		return err
	}
	// Update task's actual_time (convert seconds to minutes)
	minutes := duration / 60
	if minutes > 0 {
		if err := s.taskRepo.IncrementActualTime(session.TaskID, minutes); err != nil {
			return err
		}
	}
	return nil
}

func (s *TimerService) GetActive() (*models.TimeSession, error) {
	session, err := s.timerRepo.GetActiveSession()
	if err != nil {
		return nil, err
	}
	// Calculate live duration for active session
	session.Duration = int(time.Since(session.StartedAt).Seconds())
	return session, nil
}
