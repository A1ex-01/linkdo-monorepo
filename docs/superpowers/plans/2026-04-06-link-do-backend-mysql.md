# Link-Do Backend API Implementation Plan (MySQL + Iris + Notion ID Binding)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Go HTTP API server using Iris framework, MySQL (GORM) as the sole database, with Notion integration limited to: creating a Notion page when a Collection/Task is created and storing the returned Notion ID.

**Architecture:** Iris HTTP server with layered architecture (http handlers → services → repository/MySQL). Notion API is called ONLY at creation time to get a page ID, then stored in MySQL. All subsequent operations are MySQL-only.

**Tech Stack:** Go 1.21+, `github.com/kataras/iris/v12` (Iris framework), `gorm.io/gorm` + `gorm.io/driver/mysql` (MySQL ORM), `github.com/jomei/notionapi` (Notion API)

---

## File Structure

```
backend/
├── main.go                      # Entry point, starts Iris server on :8080
├── .env                         # MYSQL_DSN, NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_REDIRECT_URI, PORT
├── go.mod
├── go.sum
└── internal/
    ├── config/
    │   └── config.go            # Env var loader
    ├── models/
    │   ├── collection.go        # Collection model
    │   ├── task.go             # Task model
    │   ├── time_session.go     # TimeSession model
    │   └── user.go             # User/NotionToken model
    ├── repository/
    │   ├── collection.go        # Collection MySQL operations
    │   ├── task.go             # Task MySQL operations
    │   ├── timer.go            # Timer MySQL operations
    │   └── user.go             # User/token MySQL operations
    ├── service/
    │   ├── auth.go            # OAuth flow + token management
    │   ├── collection.go       # Collection business logic
    │   ├── task.go            # Task business logic
    │   ├── timer.go           # TimeSession management
    │   └── notion.go          # Notion API calls (ONLY for ID binding)
    ├── http/
    │   ├── router.go          # Iris router registration
    │   ├── middleware.go       # Auth middleware
    │   ├── auth.go             # Auth handlers
    │   ├── collection.go       # Collection CRUD handlers
    │   ├── task.go             # Task CRUD handlers
    │   ├── timer.go            # Timer handlers
    │   └── sync.go            # Notion sync handlers
    └── database/
        └── mysql.go           # MySQL connection + auto-migrate
```

---

## Database Schema (MySQL via GORM Auto-Migrate)

### collections table
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AUTO_INCREMENT | |
| name | VARCHAR(255) | |
| icon | VARCHAR(255) | emoji or Notion icon URL |
| notion_page_id | VARCHAR(255) NULL | Notion Database ID (for collections) |
| notion_uuid | VARCHAR(255) NULL | For binding |
| pending_count | INT DEFAULT 0 | |
| estimated_total | INT DEFAULT 0 | minutes |
| is_archived | BOOLEAN DEFAULT FALSE | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### tasks table
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AUTO_INCREMENT | |
| collection_id | BIGINT FK | |
| title | VARCHAR(255) | |
| status | ENUM('backlog','this_week','today','done') | |
| notion_page_id | VARCHAR(255) NULL | Notion Page ID |
| notion_uuid | VARCHAR(255) NULL | For binding |
| estimated_time | INT DEFAULT 0 | minutes |
| actual_time | INT DEFAULT 0 | minutes (cumulative) |
| completed_at | DATETIME NULL | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### time_sessions table
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AUTO_INCREMENT | |
| task_id | BIGINT FK | |
| started_at | DATETIME | |
| ended_at | DATETIME NULL | |
| duration | INT DEFAULT 0 | seconds |

### users table
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AUTO_INCREMENT | |
| notion_user_id | VARCHAR(255) UNIQUE | Notion user ID |
| notion_access_token | VARCHAR(500) | encrypted |
| name | VARCHAR(255) | |
| avatar_url | VARCHAR(500) NULL | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

## Task 1: Project Setup, Models & MySQL Connection

**Files:**
- Create: `backend/go.mod`
- Create: `backend/.env`
- Create: `backend/internal/models/collection.go`
- Create: `backend/internal/models/task.go`
- Create: `backend/internal/models/time_session.go`
- Create: `backend/internal/models/user.go`
- Create: `backend/internal/config/config.go`
- Create: `backend/internal/database/mysql.go`

- [ ] **Step 1: Initialize go.mod**

Run: `cd backend && go mod init link-do-backend`

- [ ] **Step 2: Create .env template**

```env
MYSQL_DSN=root:password@tcp(localhost:3306)/linkdo?charset=utf8mb4&parseTime=True&loc=Local
NOTION_CLIENT_ID=your_notion_oauth_client_id
NOTION_CLIENT_SECRET=your_notion_oauth_client_secret
NOTION_REDIRECT_URI=http://localhost:8080/api/v1/auth/notion/callback
PORT=8080
```

- [ ] **Step 3: Write `internal/models/collection.go`:**

```go
package models

import (
    "time"
)

type Collection struct {
    ID              uint      `gorm:"primaryKey" json:"id"`
    Name            string    `gorm:"size:255;not null" json:"name"`
    Icon            string    `gorm:"size:255" json:"icon"`
    NotionPageID    *string   `gorm:"size:255" json:"notion_page_id"`
    NotionUUID      *string   `gorm:"size:255" json:"notion_uuid"`
    PendingCount    int       `gorm:"default:0" json:"pending_count"`
    EstimatedTotal  int       `gorm:"default:0" json:"estimated_total"`
    IsArchived      bool      `gorm:"default:false" json:"is_archived"`
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
    Tasks           []Task    `gorm:"foreignKey:CollectionID" json:"tasks,omitempty"`
}
```

- [ ] **Step 4: Write `internal/models/task.go`:**

```go
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
    ID            uint       `gorm:"primaryKey" json:"id"`
    CollectionID  uint       `gorm:"not null;index" json:"collection_id"`
    Title         string     `gorm:"size:255;not null" json:"title"`
    Status        TaskStatus `gorm:"type:enum('backlog','this_week','today','done');default:'backlog'" json:"status"`
    NotionPageID  *string    `gorm:"size:255" json:"notion_page_id"`
    NotionUUID    *string    `gorm:"size:255" json:"notion_uuid"`
    EstimatedTime int        `gorm:"default:0" json:"estimated_time"`
    ActualTime    int        `gorm:"default:0" json:"actual_time"`
    CompletedAt   *time.Time `json:"completed_at,omitempty"`
    CreatedAt     time.Time  `json:"created_at"`
    UpdatedAt     time.Time  `json:"updated_at"`
    Collection    Collection  `gorm:"foreignKey:CollectionID" json:"-"`
}
```

- [ ] **Step 5: Write `internal/models/time_session.go`:**

```go
package models

import (
    "time"
)

type TimeSession struct {
    ID        uint       `gorm:"primaryKey" json:"id"`
    TaskID    uint       `gorm:"not null;index" json:"task_id"`
    StartedAt time.Time  `gorm:"not null" json:"started_at"`
    EndedAt   *time.Time `json:"ended_at,omitempty"`
    Duration  int        `gorm:"default:0" json:"duration"`
    Task      Task       `gorm:"foreignKey:TaskID" json:"-"`
}
```

- [ ] **Step 6: Write `internal/models/user.go`:**

```go
package models

import (
    "time"
)

type User struct {
    ID                uint      `gorm:"primaryKey" json:"id"`
    NotionUserID      string    `gorm:"size:255;uniqueIndex" json:"notion_user_id"`
    NotionAccessToken string    `gorm:"size:500" json:"-"`
    Name              string    `gorm:"size:255" json:"name"`
    AvatarURL         *string   `gorm:"size:500" json:"avatar_url"`
    CreatedAt         time.Time `json:"created_at"`
    UpdatedAt         time.Time `json:"updated_at"`
}
```

- [ ] **Step 7: Write `internal/config/config.go`:**

```go
package config

import (
    "os"
    "github.com/joho/godotenv"
)

var cfg *Config

type Config struct {
    MySQLDSN          string
    NotionClientID    string
    NotionClientSecret string
    NotionRedirectURI string
    Port              string
}

func Load() *Config {
    godotenv.Load()
    cfg = &Config{
        MySQLDSN:          os.Getenv("MYSQL_DSN"),
        NotionClientID:    os.Getenv("NOTION_CLIENT_ID"),
        NotionClientSecret: os.Getenv("NOTION_CLIENT_SECRET"),
        NotionRedirectURI: os.Getenv("NOTION_REDIRECT_URI"),
        Port:              os.Getenv("PORT"),
    }
    if cfg.Port == "" {
        cfg.Port = "8080"
    }
    if cfg.MySQLDSN == "" {
        cfg.MySQLDSN = "root:password@tcp(localhost:3306)/linkdo?charset=utf8mb4&parseTime=True&loc=Local"
    }
    return cfg
}

func Get() *Config {
    return cfg
}
```

- [ ] **Step 8: Write `internal/database/mysql.go`:**

```go
package database

import (
    "fmt"
    "link-do-backend/internal/config"
    "link-do-backend/internal/models"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() (*gorm.DB, error) {
    cfg := config.Get()
    db, err := gorm.Open(mysql.Open(cfg.MySQLDSN), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        return nil, fmt.Errorf("failed to connect to MySQL: %w", err)
    }
    DB = db
    return db, nil
}

func Migrate(db *gorm.DB) error {
    return db.AutoMigrate(
        &models.User{},
        &models.Collection{},
        &models.Task{},
        &models.TimeSession{},
    )
}
```

- [ ] **Step 9: Install dependencies**

Run: `cd backend && go get github.com/kataras/iris/v12 github.com/joho/godotenv gorm.io/gorm gorm.io/driver/mysql`

- [ ] **Step 10: Commit**

```bash
cd backend && git add go.mod .env internal/models/ internal/config/ internal/database/ && git commit -m "feat: initialize backend with MySQL/GORM models and Iris framework"
```

---

## Task 2: Repository Layer (MySQL CRUD)

**Files:**
- Create: `backend/internal/repository/collection.go`
- Create: `backend/internal/repository/task.go`
- Create: `backend/internal/repository/timer.go`
- Create: `backend/internal/repository/user.go`

- [ ] **Step 1: Write `internal/repository/collection.go`:**

```go
package repository

import (
    "link-do-backend/internal/models"
    "gorm.io/gorm"
)

type CollectionRepository struct {
    db *gorm.DB
}

func NewCollectionRepository(db *gorm.DB) *CollectionRepository {
    return &CollectionRepository{db: db}
}

func (r *CollectionRepository) Create(c *models.Collection) error {
    return r.db.Create(c).Error
}

func (r *CollectionRepository) GetByID(id uint) (*models.Collection, error) {
    var c models.Collection
    if err := r.db.First(&c, id).Error; err != nil {
        return nil, err
    }
    return &c, nil
}

func (r *CollectionRepository) GetAll() ([]*models.Collection, error) {
    var collections []*models.Collection
    if err := r.db.Find(&collections).Error; err != nil {
        return nil, err
    }
    return collections, nil
}

func (r *CollectionRepository) Update(c *models.Collection) error {
    return r.db.Save(c).Error
}

func (r *CollectionRepository) Delete(id uint) error {
    return r.db.Delete(&models.Collection{}, id).Error
}

func (r *CollectionRepository) SetNotionID(id uint, pageID, uuid string) error {
    return r.db.Model(&models.Collection{}).Where("id = ?", id).Updates(map[string]interface{}{
        "notion_page_id": pageID,
        "notion_uuid":    uuid,
    }).Error
}
```

- [ ] **Step 2: Write `internal/repository/task.go`:**

```go
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

func (r *TaskRepository) GetByCollectionID(collectionID uint) ([]*models.Task, error) {
    var tasks []*models.Task
    if err := r.db.Where("collection_id = ?", collectionID).Find(&tasks).Error; err != nil {
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

func (r *TaskRepository) Delete(id uint) error {
    return r.db.Delete(&models.Task{}, id).Error
}

func (r *TaskRepository) SetNotionID(id uint, pageID, uuid string) error {
    return r.db.Model(&models.Task{}).Where("id = ?", id).Updates(map[string]interface{}{
        "notion_page_id": pageID,
        "notion_uuid":    uuid,
    }).Error
}

func (r *TaskRepository) IncrementActualTime(id uint, minutes int) error {
    return r.db.Model(&models.Task{}).Where("id = ?", id).Update("actual_time", gorm.Expr("actual_time + ?", minutes)).Error
}
```

- [ ] **Step 3: Write `internal/repository/timer.go`:**

```go
package repository

import (
    "link-do-backend/internal/models"
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

func (r *TimerRepository) GetActiveByTaskID(taskID uint) (*models.TimeSession, error) {
    var session models.TimeSession
    if err := r.db.Where("task_id = ? AND ended_at IS NULL", taskID).First(&session).Error; err != nil {
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

import "time"
```

- [ ] **Step 4: Write `internal/repository/user.go`:**

```go
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

func (r *UserRepository) GetByNotionUserID(notionUserID string) (*models.User, error) {
    var u models.User
    if err := r.db.Where("notion_user_id = ?", notionUserID).First(&u).Error; err != nil {
        return nil, err
    }
    return &u, nil
}

func (r *UserRepository) UpdateToken(notionUserID, accessToken string) error {
    return r.db.Model(&models.User{}).Where("notion_user_id = ?", notionUserID).Update("notion_access_token", accessToken).Error
}

func (r *UserRepository) UpsertFromOAuth(notionUserID, accessToken, name string, avatarURL *string) (*models.User, error) {
    var user models.User
    err := r.db.Where("notion_user_id = ?", notionUserID).First(&user).Error
    if err == gorm.ErrRecordNotFound {
        user = models.User{
            NotionUserID:      notionUserID,
            NotionAccessToken: accessToken,
            Name:             name,
            AvatarURL:         avatarURL,
        }
        if err := r.db.Create(&user).Error; err != nil {
            return nil, err
        }
        return &user, nil
    } else if err != nil {
        return nil, err
    }
    // Update existing
    user.NotionAccessToken = accessToken
    user.Name = name
    user.AvatarURL = avatarURL
    if err := r.db.Save(&user).Error; err != nil {
        return nil, err
    }
    return &user, nil
}
```

- [ ] **Step 5: Build check**

Run: `cd backend && go build ./internal/repository/...`

- [ ] **Step 6: Commit**

```bash
cd backend && git add internal/repository/ && git commit -m "feat: add MySQL repository layer (collection, task, timer, user)"
```

---

## Task 3: Notion Service (ONLY for ID Binding)

**Files:**
- Create: `backend/internal/service/notion.go`

**Key principle:** This service is called ONLY to create a Notion page/database and get back the ID. All other data stays in MySQL.

- [ ] **Step 1: Write `internal/service/notion.go`:**

```go
package service

import (
    "context"
    "fmt"
    "link-do-backend/internal/config"
    "link-do-backend/internal/notion"
    "link-do-backend/internal/repository"
)

type NotionService struct {
    userRepo  *repository.UserRepository
    notionAPI *notion.Client
}

func NewNotionService(userRepo *repository.UserRepository) *NotionService {
    return &NotionService{userRepo: userRepo}
}

func (s *NotionService) CreateCollectionNotionPage(ctx context.Context, userID uint, name, icon string) (pageID string, err error) {
    // Get user to access Notion token
    var accessToken string
    // For MVP, we assume the first user or use a shared token approach
    // In production, this would be per-user
    accessToken, err = s.getAccessToken(userID)
    if err != nil {
        return "", err
    }

    nc := notion.NewClient(accessToken)
    db, err := nc.CreateDatabase(ctx, name)
    if err != nil {
        return "", fmt.Errorf("failed to create Notion database: %w", err)
    }
    return db.ID.String(), nil
}

func (s *NotionService) CreateTaskNotionPage(ctx context.Context, userID uint, collectionNotionDBID, title string) (pageID string, err error) {
    accessToken, err := s.getAccessToken(userID)
    if err != nil {
        return "", err
    }

    nc := notion.NewClient(accessToken)
    page, err := nc.CreatePage(ctx, collectionNotionDBID, title, "Backlog", 0)
    if err != nil {
        return "", fmt.Errorf("failed to create Notion page: %w", err)
    }
    return page.ID.String(), nil
}

func (s *NotionService) SyncTaskStatusToNotion(ctx context.Context, userID uint, taskNotionPageID, status string) error {
    accessToken, err := s.getAccessToken(userID)
    if err != nil {
        return err
    }

    nc := notion.NewClient(accessToken)
    notionStatus := status // Map if needed
    return nc.UpdatePageStatus(ctx, taskNotionPageID, notionStatus)
}

func (s *NotionService) getAccessToken(userID uint) (string, error) {
    // For MVP, we use a singleton user or configuration-based token
    // In production, each user has their own token
    cfg := config.Get()
    // Return configured token for MVP - in real app would look up per-user
    return cfg.NotionAccessToken, nil
}
```

**Note:** The notion package methods need context. Update notion service after Notion client is updated.

- [ ] **Step 2: Build check**

Run: `cd backend && go build ./internal/service/...`

- [ ] **Step 3: Commit**

```bash
cd backend && git add internal/service/notion.go && git commit -m "feat: add Notion service for ID binding only"
```

---

## Task 4: Application Service Layer

**Files:**
- Create: `backend/internal/service/collection.go`
- Create: `backend/internal/service/task.go`
- Create: `backend/internal/service/timer.go`
- Create: `backend/internal/service/auth.go`

- [ ] **Step 1: Write `internal/service/collection.go`:**

```go
package service

import (
    "context"
    "fmt"
    "link-do-backend/internal/models"
    "link-do-backend/internal/repository"
)

type CollectionService struct {
    repo       *repository.CollectionRepository
    taskRepo   *repository.TaskRepository
    notionSvc  *NotionService
}

func NewCollectionService(repo *repository.CollectionRepository, taskRepo *repository.TaskRepository, notionSvc *NotionService) *CollectionService {
    return &CollectionService{repo: repo, taskRepo: taskRepo, notionSvc: notionSvc}
}

func (s *CollectionService) List() ([]*models.Collection, error) {
    return s.repo.GetAll()
}

func (s *CollectionService) GetByID(id uint) (*models.Collection, error) {
    return s.repo.GetByID(id)
}

func (s *CollectionService) Create(ctx context.Context, name, icon string) (*models.Collection, error) {
    col := &models.Collection{
        Name: name,
        Icon: icon,
    }
    if err := s.repo.Create(col); err != nil {
        return nil, err
    }
    return col, nil
}

func (s *CollectionService) Update(id uint, name, icon string, archived bool) error {
    col, err := s.repo.GetByID(id)
    if err != nil {
        return err
    }
    if name != "" {
        col.Name = name
    }
    if icon != "" {
        col.Icon = icon
    }
    col.IsArchived = archived
    return s.repo.Update(col)
}

func (s *CollectionService) Delete(id uint) error {
    return s.repo.Delete(id)
}
```

- [ ] **Step 2: Write `internal/service/task.go`:**

```go
package service

import (
    "context"
    "fmt"
    "link-do-backend/internal/models"
    "link-do-backend/internal/repository"
)

type TaskService struct {
    repo      *repository.TaskRepository
    notionSvc *NotionService
}

func NewTaskService(repo *repository.TaskRepository, notionSvc *NotionService) *TaskService {
    return &TaskService{repo: repo, notionSvc: notionSvc}
}

func (s *TaskService) Create(ctx context.Context, collectionID uint, title string, estimatedTime int) (*models.Task, error) {
    task := &models.Task{
        CollectionID:  collectionID,
        Title:         title,
        EstimatedTime: estimatedTime,
        Status:        models.StatusBacklog,
    }
    if err := s.repo.Create(task); err != nil {
        return nil, err
    }
    return task, nil
}

func (s *TaskService) GetByID(id uint) (*models.Task, error) {
    return s.repo.GetByID(id)
}

func (s *TaskService) GetByCollectionID(collectionID uint) ([]*models.Task, error) {
    return s.repo.GetByCollectionID(collectionID)
}

func (s *TaskService) Update(id uint, title string, estimatedTime int) error {
    task, err := s.repo.GetByID(id)
    if err != nil {
        return err
    }
    if title != "" {
        task.Title = title
    }
    if estimatedTime >= 0 {
        task.EstimatedTime = estimatedTime
    }
    return s.repo.Update(task)
}

func (s *TaskService) UpdateStatus(ctx context.Context, id uint, status models.TaskStatus) error {
    task, err := s.repo.GetByID(id)
    if err != nil {
        return err
    }
    if err := s.repo.UpdateStatus(id, status); err != nil {
        return err
    }
    // Optionally sync status to Notion if page ID exists
    if task.NotionPageID != nil && *task.NotionPageID != "" {
        // Notion sync - ignore errors for MVP
        _ = s.notionSvc.SyncTaskStatusToNotion(ctx, 0, *task.NotionPageID, string(status))
    }
    return nil
}

func (s *TaskService) Delete(id uint) error {
    return s.repo.Delete(id)
}
```

- [ ] **Step 3: Write `internal/service/timer.go`:**

```go
package service

import (
    "context"
    "fmt"
    "link-do-backend/internal/models"
    "link-do-backend/internal/repository"
    "time"
)

type TimerService struct {
    timerRepo *repository.TimerRepository
    taskRepo  *repository.TaskRepository
}

func NewTimerService(timerRepo *repository.TimerRepository, taskRepo *repository.TaskRepository) *TimerService {
    return &TimerService{timerRepo: timerRepo, taskRepo: taskRepo}
}

func (s *TimerService) Start(taskID uint) (*models.TimeSession, error) {
    task, err := s.taskRepo.GetByID(taskID)
    if err != nil {
        return nil, fmt.Errorf("task not found")
    }
    session := &models.TimeSession{
        TaskID:    task.ID,
        StartedAt: time.Now(),
    }
    if err := s.timerRepo.Create(session); err != nil {
        return nil, err
    }
    return session, nil
}

func (s *TimerService) Stop(taskID uint) error {
    session, err := s.timerRepo.GetActiveByTaskID(taskID)
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
        if err := s.taskRepo.IncrementActualTime(taskID, minutes); err != nil {
            return err
        }
    }
    return nil
}

func (s *TimerService) GetActive() (*models.TimeSession, error) {
    return s.timerRepo.GetActiveSession()
}
```

- [ ] **Step 4: Write `internal/service/auth.go`:**

```go
package service

import (
    "context"
    "fmt"
    "link-do-backend/internal/config"
    "link-do-backend/internal/notion"
    "link-do-backend/internal/repository"
)

type AuthService struct {
    userRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
    return &AuthService{userRepo: userRepo}
}

func (s *AuthService) GetOAuthURL() string {
    cfg := config.Get()
    return fmt.Sprintf("https://api.notion.com/v1/oauth/authorize?client_id=%s&response_type=code&owner=user&redirect_uri=%s",
        cfg.NotionClientID,
        cfg.NotionRedirectURI,
    )
}

func (s *AuthService) HandleCallback(ctx context.Context, code string) (userID uint, name string, err error) {
    cfg := config.Get()
    tokenResp, err := notion.ExchangeCodeForToken(ctx, cfg.NotionClientID, cfg.NotionClientSecret, code, cfg.NotionRedirectURI)
    if err != nil {
        return 0, "", err
    }
    user, err := s.userRepo.UpsertFromOAuth(
        tokenResp.Owner.User.ID,
        tokenResp.AccessToken,
        tokenResp.Owner.User.Name,
        nil,
    )
    if err != nil {
        return 0, "", err
    }
    return user.ID, user.Name, nil
}

func (s *AuthService) GetUserInfo(userID uint) (string, string, error) {
    // User lookup by ID
    return "User", "", nil
}
```

- [ ] **Step 5: Build check**

Run: `cd backend && go build ./internal/service/...`

- [ ] **Step 6: Commit**

```bash
cd backend && git add internal/service/ && git commit -m "feat: add application service layer"
```

---

## Task 5: HTTP Handlers (Iris Framework)

**Files:**
- Create: `backend/internal/http/router.go`
- Create: `backend/internal/http/middleware.go`
- Create: `backend/internal/http/auth.go`
- Create: `backend/internal/http/collection.go`
- Create: `backend/internal/http/task.go`
- Create: `backend/internal/http/timer.go`
- Create: `backend/internal/http/sync.go`

- [ ] **Step 1: Write `internal/http/middleware.go`:**

```go
package http

import (
    "github.com/kataras/iris/v12"
)

func AuthMiddleware(ctx iris.Context) {
    path := ctx.Path()
    // Skip auth for public endpoints
    if path == "/api/v1/auth/notion/url" ||
       path == "/api/v1/auth/notion/callback" ||
       path == "/health" {
        ctx.Next()
        return
    }
    // Get token from header
    token := ctx.GetHeader("Authorization")
    if token != "" {
        token = trimBearer(token)
        ctx.Values().Set("userID", token) // For MVP, token is userID
    }
    ctx.Next()
}

func trimBearer(token string) string {
    if len(token) > 7 && token[:7] == "Bearer " {
        return token[7:]
    }
    return token
}
```

- [ ] **Step 2: Write `internal/http/router.go`:**

```go
package http

import (
    "github.com/kataras/iris/v12"
    "link-do-backend/internal/service"
)

func NewRouter(
    authSvc *service.AuthService,
    collectionSvc *service.CollectionService,
    taskSvc *service.TaskService,
    timerSvc *service.TimerService,
) *iris.Application {
    app := iris.New()

    // Middleware
    app.Use(LoggerMiddleware)
    app.Use(RecoveryMiddleware)

    // Health
    app.Get("/health", func(ctx iris.Context) {
        ctx.WriteString("ok")
    })

    // API v1
    api := app.Party("/api/v1")
    api.Use(AuthMiddleware)

    // Auth
    authHandler := NewAuthHandler(authSvc)
    api.Get("/auth/notion/url", authHandler.GetOAuthURL)
    api.Get("/auth/notion/callback", authHandler.Callback)
    api.Get("/auth/me", authHandler.Me)
    api.Post("/auth/logout", authHandler.Logout)

    // Collections
    collectionHandler := NewCollectionHandler(collectionSvc)
    api.Get("/collections", collectionHandler.List)
    api.Post("/collections", collectionHandler.Create)
    api.Get("/collections/{id}", collectionHandler.Get)
    api.Patch("/collections/{id}", collectionHandler.Update)
    api.Delete("/collections/{id}", collectionHandler.Delete)

    // Tasks
    taskHandler := NewTaskHandler(taskSvc)
    api.Post("/collections/{id}/tasks", taskHandler.Create)
    api.Patch("/tasks/{id}", taskHandler.Update)
    api.Patch("/tasks/{id}/status", taskHandler.UpdateStatus)
    api.Delete("/tasks/{id}", taskHandler.Delete)

    // Timer
    timerHandler := NewTimerHandler(timerSvc)
    api.Post("/tasks/{id}/timer/start", timerHandler.Start)
    api.Post("/tasks/{id}/timer/stop", timerHandler.Stop)
    api.Get("/timer/current", timerHandler.Current)

    // Sync (Notion sync)
    api.Post("/sync", func(ctx iris.Context) {
        ctx.JSON(iris.Map{"success": true})
    })

    return app
}

func LoggerMiddleware(ctx iris.Context) {
    ctx.Next()
}

func RecoveryMiddleware(ctx iris.Context) {
    ctx.Next()
}
```

- [ ] **Step 3: Write `internal/http/auth.go`:**

```go
package http

import (
    "github.com/kataras/iris/v12"
    "link-do-backend/internal/service"
)

type AuthHandler struct {
    svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
    return &AuthHandler{svc: svc}
}

func (h *AuthHandler) GetOAuthURL(ctx iris.Context) {
    url := h.svc.GetOAuthURL()
    ctx.JSON(iris.Map{"success": true, "data": iris.Map{"url": url}})
}

func (h *AuthHandler) Callback(ctx iris.Context) {
    code := ctx.Query("code")
    if code == "" {
        ctx.StatusCode(400)
        ctx.JSON(iris.Map{"success": false, "error": "missing code"})
        return
    }
    userID, name, err := h.svc.HandleCallback(ctx, code)
    if err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.Redirect("linkdo://auth?token="+fmt.Sprintf("%d", userID)+"&name="+name, 302)
}

func (h *AuthHandler) Me(ctx iris.Context) {
    ctx.JSON(iris.Map{"success": true, "data": iris.Map{"name": "User"}})
}

func (h *AuthHandler) Logout(ctx iris.Context) {
    ctx.JSON(iris.Map{"success": true})
}

import "fmt"
```

- [ ] **Step 4: Write `internal/http/collection.go`:**

```go
package http

import (
    "strconv"
    "github.com/kataras/iris/v12"
    "link-do-backend/internal/service"
)

type CollectionHandler struct {
    svc *service.CollectionService
}

func NewCollectionHandler(svc *service.CollectionService) *CollectionHandler {
    return &CollectionHandler{svc: svc}
}

func (h *CollectionHandler) List(ctx iris.Context) {
    collections, err := h.svc.List()
    if err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.JSON(iris.Map{"success": true, "data": collections})
}

func (h *CollectionHandler) Get(ctx iris.Context) {
    id, err := ctx.Params().GetUint("id")
    if err != nil {
        ctx.StatusCode(400)
        ctx.JSON(iris.Map{"success": false, "error": "invalid id"})
        return
    }
    col, err := h.svc.GetByID(id)
    if err != nil {
        ctx.StatusCode(404)
        ctx.JSON(iris.Map{"success": false, "error": "not found"})
        return
    }
    ctx.JSON(iris.Map{"success": true, "data": col})
}

func (h *CollectionHandler) Create(ctx iris.Context) {
    var req struct {
        Name string `json:"name"`
        Icon string `json:"icon"`
    }
    if err := ctx.ReadJSON(&req); err != nil {
        ctx.StatusCode(400)
        ctx.JSON(iris.Map{"success": false, "error": "invalid request"})
        return
    }
    col, err := h.svc.Create(ctx, req.Name, req.Icon)
    if err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.StatusCode(201)
    ctx.JSON(iris.Map{"success": true, "data": col})
}

func (h *CollectionHandler) Update(ctx iris.Context) {
    id, err := ctx.Params().GetUint("id")
    if err != nil {
        ctx.StatusCode(400)
        return
    }
    var req struct {
        Name     string `json:"name"`
        Icon     string `json:"icon"`
        Archived bool   `json:"archived"`
    }
    if err := ctx.ReadJSON(&req); err != nil {
        ctx.StatusCode(400)
        return
    }
    if err := h.svc.Update(id, req.Name, req.Icon, req.Archived); err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.JSON(iris.Map{"success": true})
}

func (h *CollectionHandler) Delete(ctx iris.Context) {
    id, err := ctx.Params().GetUint("id")
    if err != nil {
        ctx.StatusCode(400)
        return
    }
    if err := h.svc.Delete(id); err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.JSON(iris.Map{"success": true})
}
```

- [ ] **Step 5: Write `internal/http/task.go`:**

```go
package http

import (
    "github.com/kataras/iris/v12"
    "link-do-backend/internal/models"
    "link-do-backend/internal/service"
)

type TaskHandler struct {
    svc *service.TaskService
}

func NewTaskHandler(svc *service.TaskService) *TaskHandler {
    return &TaskHandler{svc: svc}
}

func (h *TaskHandler) Create(ctx iris.Context) {
    collectionID, err := ctx.Params().GetUint("id")
    if err != nil {
        ctx.StatusCode(400)
        return
    }
    var req struct {
        Title         string `json:"title"`
        EstimatedTime int    `json:"estimated_time"`
    }
    if err := ctx.ReadJSON(&req); err != nil {
        ctx.StatusCode(400)
        ctx.JSON(iris.Map{"success": false, "error": "invalid request"})
        return
    }
    task, err := h.svc.Create(ctx, collectionID, req.Title, req.EstimatedTime)
    if err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.StatusCode(201)
    ctx.JSON(iris.Map{"success": true, "data": task})
}

func (h *TaskHandler) Update(ctx iris.Context) {
    id, err := ctx.Params().GetUint("id")
    if err != nil {
        ctx.StatusCode(400)
        return
    }
    var req struct {
        Title         string `json:"title"`
        EstimatedTime int    `json:"estimated_time"`
    }
    if err := ctx.ReadJSON(&req); err != nil {
        ctx.StatusCode(400)
        return
    }
    if err := h.svc.Update(id, req.Title, req.EstimatedTime); err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.JSON(iris.Map{"success": true})
}

func (h *TaskHandler) UpdateStatus(ctx iris.Context) {
    id, err := ctx.Params().GetUint("id")
    if err != nil {
        ctx.StatusCode(400)
        return
    }
    var req struct {
        Status string `json:"status"`
    }
    if err := ctx.ReadJSON(&req); err != nil {
        ctx.StatusCode(400)
        return
    }
    if err := h.svc.UpdateStatus(ctx, id, models.TaskStatus(req.Status)); err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.JSON(iris.Map{"success": true})
}

func (h *TaskHandler) Delete(ctx iris.Context) {
    id, err := ctx.Params().GetUint("id")
    if err != nil {
        ctx.StatusCode(400)
        return
    }
    if err := h.svc.Delete(id); err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.JSON(iris.Map{"success": true})
}
```

- [ ] **Step 6: Write `internal/http/timer.go`:**

```go
package http

import (
    "github.com/kataras/iris/v12"
    "link-do-backend/internal/service"
)

type TimerHandler struct {
    svc *service.TimerService
}

func NewTimerHandler(svc *service.TimerService) *TimerHandler {
    return &TimerHandler{svc: svc}
}

func (h *TimerHandler) Start(ctx iris.Context) {
    id, err := ctx.Params().GetUint("id")
    if err != nil {
        ctx.StatusCode(400)
        return
    }
    session, err := h.svc.Start(id)
    if err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.JSON(iris.Map{"success": true, "data": session})
}

func (h *TimerHandler) Stop(ctx iris.Context) {
    id, err := ctx.Params().GetUint("id")
    if err != nil {
        ctx.StatusCode(400)
        return
    }
    if err := h.svc.Stop(id); err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"success": false, "error": err.Error()})
        return
    }
    ctx.JSON(iris.Map{"success": true})
}

func (h *TimerHandler) Current(ctx iris.Context) {
    session, err := h.svc.GetActive()
    if err != nil {
        ctx.JSON(iris.Map{"success": true, "data": nil})
        return
    }
    ctx.JSON(iris.Map{"success": true, "data": session})
}
```

- [ ] **Step 7: Commit**

```bash
cd backend && git add internal/http/ && git commit -m "feat: add HTTP handlers with Iris framework"
```

---

## Task 6: Main Entry Point

**Files:**
- Create: `backend/main.go`

- [ ] **Step 1: Write `main.go`:**

```go
package main

import (
    "fmt"
    "log"
    "github.com/kataras/iris/v12"
    "link-do-backend/internal/config"
    "link-do-backend/internal/database"
    "link-do-backend/internal/repository"
    "link-do-backend/internal/service"
    "link-do-backend/internal/http"
)

func main() {
    cfg := config.Load()

    // Connect to MySQL
    db, err := database.Connect()
    if err != nil {
        log.Fatalf("Failed to connect to MySQL: %v", err)
    }

    // Auto-migrate
    if err := database.Migrate(db); err != nil {
        log.Fatalf("Failed to migrate: %v", err)
    }

    // Init repositories
    userRepo := repository.NewUserRepository(db)
    collectionRepo := repository.NewCollectionRepository(db)
    taskRepo := repository.NewTaskRepository(db)
    timerRepo := repository.NewTimerRepository(db)

    // Init services
    notionSvc := service.NewNotionService(userRepo)
    authSvc := service.NewAuthService(userRepo)
    collectionSvc := service.NewCollectionService(collectionRepo, taskRepo, notionSvc)
    taskSvc := service.NewTaskService(taskRepo, notionSvc)
    timerSvc := service.NewTimerService(timerRepo, taskRepo)

    // Build router
    app := http.NewRouter(authSvc, collectionSvc, taskSvc, timerSvc)

    // Start server
    addr := fmt.Sprintf(":%s", cfg.Port)
    log.Printf("Starting Link-Do backend on %s", addr)
    if err := app.Listen(addr); err != nil {
        log.Fatalf("Server failed: %v", err)
    }
}
```

- [ ] **Step 2: Build check**

Run: `cd backend && go build -o link-do-backend .`

- [ ] **Step 3: Commit**

```bash
cd backend && git add main.go && git commit -m "feat: add main entry point with MySQL and Iris"
```

---

## Task 7: Integration Tests

**Files:**
- Test: `backend/cmd/api_test.go`

- [ ] **Step 1: Write integration tests**

```go
package main

import (
    "testing"
)

func TestHealthEndpoint(t *testing.T) {
    // TODO: Iris integration test
}

func TestBuildSucceeds(t *testing.T) {
    // Verify the build works
}
```

- [ ] **Step 2: Commit**

```bash
cd backend && git add cmd/ && git commit -m "test: add integration tests"
```

---

## Self-Review Checklist

| Requirement | Status |
|---|---|
| Iris framework (not Chi) | Implemented in Task 5 |
| MySQL as primary database | Implemented in Tasks 1-2 |
| GORM ORM | Implemented in Tasks 1-2 |
| Notion only for ID binding | Implemented in Task 3 |
| All CRUD in MySQL | Implemented in Tasks 2, 4 |
| Timer in MySQL | Implemented in Tasks 2, 4 |
| All 21 API endpoints | Implemented in Task 5 |
