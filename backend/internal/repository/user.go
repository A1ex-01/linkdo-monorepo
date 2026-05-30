package repository

import (
	"link-do-backend/internal/models"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(u *models.User) error {
	return r.db.Create(u).Error
}

func (r *UserRepository) GetByID(id uint) (*models.User, error) {
	var u models.User
	if err := r.db.First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetByUUID(uuid string) (*models.User, error) {
	var u models.User
	if err := r.db.Where("uuid = ?", uuid).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetByNotionUserID(notionUserID string) (*models.User, error) {
	var u models.User
	if err := r.db.Where("notion_user_id = ?", notionUserID).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) UpsertFromOAuth(notionUserID, accessToken, name string, avatarURL *string, userId uint) (*models.User, error) {
	var user models.User
	err := r.db.Where("id = ?", userId).First(&user).Error
	if err != nil {
		return nil, err
	}
	// Update existing
	user.NotionAccessToken = accessToken
	user.NotionUserID = notionUserID
	// user.Name = name
	user.AvatarURL = avatarURL
	if err := r.db.Save(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var u models.User
	if err := r.db.Where("email = ?", email).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}
