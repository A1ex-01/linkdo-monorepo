package utils

import (
	"github.com/google/uuid"
)

const (
	UserPrefix           = ""
	CollectionPrefix     = ""
	TaskPrefix           = ""
	NotionDatabasePrefix = ""
	TimeSessionPrefix    = ""
)

func NewUserUUID() string {
	return uuid.New().String()
}

func NewCollectionUUID() string {
	return uuid.New().String()
}

func NewTaskUUID() string {
	return uuid.New().String()
}

func NewNotionDatabaseUUID() string {
	return uuid.New().String()
}

func NewTimeSessionUUID() string {
	return uuid.New().String()
}

func GetPrefixFromUUID(uuidStr string) string {
	if len(uuidStr) < 3 {
		return ""
	}
	for i := 0; i < len(uuidStr); i++ {
		if uuidStr[i] == '_' {
			return uuidStr[:i]
		}
	}
	return ""
}
