package models

import (
	"time"
)

type TimeSession struct {
	ID        uint       `gorm:"primaryKey" json:"-"`
	UUID      string     `gorm:"size:36;uniqueIndex;not null" json:"uuid"`
	TaskID    uint       `gorm:"not null;index" json:"-"`
	TaskUUID  string     `gorm:"size:36;not null;index" json:"task_uuid"`
	StartedAt time.Time  `gorm:"not null" json:"started_at"`
	EndedAt   *time.Time `json:"ended_at,omitempty"`
	Duration  int        `gorm:"default:0" json:"duration"`
	Task      Task       `gorm:"foreignKey:TaskUUID" json:"-"`
}
