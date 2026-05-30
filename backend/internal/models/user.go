package models

import (
	"time"
)

type User struct {
	ID                uint      `gorm:"primaryKey" json:"-"`
	UUID              string    `gorm:"size:36;uniqueIndex;not null" json:"uuid"`
	NotionUserID      string    `gorm:"size:255" json:"notion_user_id"`
	NotionAccessToken string    `gorm:"size:500" json:"-"`
	Email             string    `gorm:"size:255;uniqueIndex" json:"email"`
	Name              string    `gorm:"size:255" json:"name"`
	AvatarURL         *string   `gorm:"size:500" json:"avatar_url"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
