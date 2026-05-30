package models

import (
	"time"
)

type NotionDatabase struct {
	ID               uint      `gorm:"primaryKey" json:"-"`
	UUID             string    `gorm:"size:36;uniqueIndex;not null" json:"uuid"`
	CollectionID     uint      `gorm:"not null;index" json:"-"`
	CollectionUUID   string    `gorm:"size:36;not null;index" json:"collection_uuid"`
	NotionDatabaseID string    `gorm:"size:255;not null" json:"notion_database_id"`
	Name             string    `gorm:"size:255" json:"name"`
	Icon             string    `gorm:"size:255" json:"icon"`
	StatusMapping    string    `gorm:"type:text" json:"status_mapping"`
	NotionOptions    []string  `gorm:"-" json:"notion_options,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	Collection       Collection `gorm:"foreignKey:CollectionUUID" json:"-"`
}

func (NotionDatabase) TableName() string {
	return "notion_databases"
}
