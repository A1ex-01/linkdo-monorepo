package models

import (
	"time"
)

type TaskStatus string

const (
	StatusBacklog   TaskStatus = "backlog"
	StatusThisWeek TaskStatus = "this_week"
	StatusToday     TaskStatus = "today"
	StatusDone      TaskStatus = "done"
)

type Task struct {
	ID                 uint       `gorm:"primaryKey" json:"-"`
	UUID               string     `gorm:"size:36;uniqueIndex;not null" json:"uuid"`
	CollectionID       uint       `gorm:"not null;index" json:"-"`
	CollectionUUID     string     `gorm:"size:36;not null;index" json:"collection_uuid"`
	NotionDatabaseID   *uint      `gorm:"index" json:"-"`
	NotionDatabaseUUID *string    `gorm:"size:36;index" json:"notion_database_uuid,omitempty"`
	Title              string     `gorm:"size:255;not null" json:"title"`
	Status             TaskStatus `gorm:"type:enum('backlog','this_week','today','done');default:'backlog'" json:"status"`
	NotionPageID       *string    `gorm:"size:255" json:"notion_page_id,omitempty"`
	NotionUUID         *string    `gorm:"size:255" json:"notion_uuid,omitempty"`
	EstimatedTime      int        `gorm:"default:0" json:"estimated_time"`
	ActualTime         int        `gorm:"default:0" json:"actual_time"`
	CompletedAt        *time.Time `json:"completed_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
	Collection         Collection `gorm:"foreignKey:CollectionUUID" json:"-"`
}
