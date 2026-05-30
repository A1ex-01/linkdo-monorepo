package models

import (
	"time"
)

type Collection struct {
	ID              uint              `gorm:"primaryKey" json:"-"`
	UUID            string            `gorm:"size:36;uniqueIndex;not null" json:"uuid"`
	UserID          uint              `gorm:"not null;index" json:"-"`
	Name            string            `gorm:"size:255;not null" json:"name"`
	Icon            string            `gorm:"size:255" json:"icon"`
	NotionUUID      *string           `gorm:"size:255" json:"notion_uuid,omitempty"`
	PendingCount    int               `gorm:"default:0" json:"pending_count"`
	EstimatedTotal  int               `gorm:"default:0" json:"estimated_total"`
	IsArchived      bool              `gorm:"default:false" json:"is_archived"`
	NotionDatabases []NotionDatabase  `gorm:"foreignKey:CollectionUUID" json:"notion_databases,omitempty"`
	Tasks           []Task            `gorm:"foreignKey:CollectionUUID" json:"tasks,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
}
