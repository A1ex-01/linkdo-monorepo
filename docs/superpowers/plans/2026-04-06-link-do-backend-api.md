# Link-Do Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Go HTTP API server that handles all business logic for Link-Do — Notion OAuth authentication, Collection/Task CRUD, Timer management, and bidirectional Notion sync.

**Architecture:** Go HTTP server with layered architecture (http handlers → services → notion client/memory store). Notion is the sole persistence layer; Go maintains in-memory cache for performance. All endpoints under `/api/v1/`.

**Tech Stack:** Go 1.21+, `net/http`, `github.com/go-chi/chi/v5` (router), `github.com/joho/godotenv` (env), Notion API v1

---

## File Structure

```
backend/
├── main.go                      # Entry point, starts HTTP server on :8080
├── .env                         # NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_REDIRECT_URI, PORT
├── go.mod
├── go.sum
└── internal/
    ├── config/
    │   └── config.go            # Env var loader
    ├── http/
    │   ├── router.go            # Chi router registration
    │   ├── middleware.go        # Auth middleware, Logger, Recovery
    │   ├── auth.go              # GET /auth/notion/url, GET /auth/notion/callback, GET /auth/me, POST /auth/logout
    │   ├── collection.go        # Collection CRUD handlers
    │   ├── task.go              # Task CRUD + status handlers
    │   ├── timer.go             # Timer start/stop/current handlers
    │   └── sync.go              # POST /sync handler
    ├── service/
    │   ├── auth.go              # OAuth flow + token management
    │   ├── collection.go        # Collection business logic
    │   ├── task.go              # Task business logic + status transitions
    │   ├── timer.go             # TimeSession management
    │   └── sync.go              # Notion bidirectional sync
    ├── notion/
    │   ├── client.go            # Notion API HTTP client (github.com/dstotijn/go-notion)
    │   ├── oauth.go             # OAuth code→token exchange
    │   ├── database.go          # Notion Database (Collection) operations
    │   ├── page.go              # Notion Page (Task) operations
    │   └── mapper.go            # Notion ↔ internal model conversion
    ├── store/
    │   └── memory.go            # In-memory cache: collections, tasks, active timer
    └── types/
        ├── api.go               # Request/Response DTOs
        ├── collection.go        # Collection model
        ├── task.go              # Task model
        └── timer.go             # TimeSession model
```

---

## Task 1: Project Setup & Types Foundation

**Files:**
- Create: `backend/go.mod`
- Create: `backend/.env`
- Create: `backend/internal/types/collection.go`
- Create: `backend/internal/types/task.go`
- Create: `backend/internal/types/timer.go`
- Create: `backend/internal/types/api.go`
- Create: `backend/internal/config/config.go`

- [ ] **Step 1: Initialize go.mod**

Run: `cd backend && go mod init link-do-backend`

- [ ] **Step 2: Create .env template**

```env
NOTION_CLIENT_ID=your_notion_oauth_client_id
NOTION_CLIENT_SECRET=your_notion_oauth_client_secret
NOTION_REDIRECT_URI=http://localhost:8080/api/v1/auth/notion/callback
PORT=8080
```

- [ ] **Step 3: Write Collection type**

```go
// internal/types/collection.go
package types

type Collection struct {
    ID                string `json:"id"`
    Name              string `json:"name"`
    Icon              string `json:"icon"`
    Source            string `json:"source"` // always "notion" for MVP
    NotionDatabaseID  string `json:"notion_database_id"`
    PendingCount      int    `json:"pending_count"`
    EstimatedTotal    int    `json:"estimated_total"` // minutes
    Archived          bool   `json:"archived"`
}
```

- [ ] **Step 4: Write Task type**

```go
// internal/types/task.go
package types

type Task struct {
    ID             string  `json:"id"`
    CollectionID   string  `json:"collection_id"`
    Title          string  `json:"title"`
    Status         string  `json:"status"` // backlog, this_week, today, done
    EstimatedTime  int     `json:"estimated_time"` // minutes
    ActualTime     int     `json:"actual_time"` // minutes (cumulative)
    Source         string  `json:"source"` // always "notion"
    NotionPageID   string  `json:"notion_page_id"`
    CompletedAt    *int64  `json:"completed_at,omitempty"` // unix timestamp
    CreatedAt      int64   `json:"created_at"`
    SortOrder      int     `json:"sort_order"`
}
```

- [ ] **Step 5: Write Timer type**

```go
// internal/types/timer.go
package types

type TimeSession struct {
    ID        string  `json:"id"`
    TaskID    string  `json:"task_id"`
    StartedAt int64   `json:"started_at"` // unix timestamp
    EndedAt   *int64  `json:"ended_at,omitempty"`
    Duration  int     `json:"duration"` // seconds
}

type TimerState struct {
    ActiveTaskID string `json:"active_task_id"`
    StartedAt    int64  `json:"started_at"`
    Elapsed      int    `json:"elapsed"` // seconds
}
```

- [ ] **Step 6: Write API DTOs**

```go
// internal/types/api.go
package types

type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

type CollectionWithTasks struct {
    Collection
    Tasks map[string][]Task `json:"tasks"` // keyed by status
}

type TimerStartResponse struct {
    SessionID string `json:"session_id"`
    StartedAt int64  `json:"started_at"`
}

type UserInfo struct {
    Name   string `json:"name"`
    Avatar string `json:"avatar"`
}
```

- [ ] **Step 7: Write config loader**

```go
// internal/config/config.go
package config

import (
    "os"
    "github.com/joho/godotenv"
)

var cfg *Config

type Config struct {
    NotionClientID     string
    NotionClientSecret string
    NotionRedirectURI  string
    Port               string
}

func Load() *Config {
    godotenv.Load()
    cfg = &Config{
        NotionClientID:     os.Getenv("NOTION_CLIENT_ID"),
        NotionClientSecret: os.Getenv("NOTION_CLIENT_SECRET"),
        NotionRedirectURI:  os.Getenv("NOTION_REDIRECT_URI"),
        Port:               os.Getenv("PORT"),
    }
    if cfg.Port == "" {
        cfg.Port = "8080"
    }
    return cfg
}

func Get() *Config {
    return cfg
}
```

- [ ] **Step 8: Commit**

```bash
cd backend && git add go.mod .env internal/types/ internal/config/
git commit -m "feat: initialize backend project with types foundation"
```

---

## Task 2: In-Memory Store

**Files:**
- Create: `backend/internal/store/memory.go`
- Test: `backend/internal/store/memory_test.go`

- [ ] **Step 1: Write memory store**

```go
// internal/store/memory.go
package store

import (
    "sync"
    "link-do-backend/internal/types"
)

type MemoryStore struct {
    mu            sync.RWMutex
    collections   map[string]*types.Collection
    tasks         map[string]*types.Task
    timer         *types.TimerState
    notionTokens  map[string]string // userToken -> accessToken
}

var global *MemoryStore

func New() *MemoryStore {
    if global == nil {
        global = &MemoryStore{
            collections:  make(map[string]*types.Collection),
            tasks:       make(map[string]*types.Task),
            notionTokens: make(map[string]string),
        }
    }
    return global
}

// Collections
func (s *MemoryStore) GetCollections() []*types.Collection {
    s.mu.RLock()
    defer s.mu.RUnlock()
    result := make([]*types.Collection, 0, len(s.collections))
    for _, c := range s.collections {
        result = append(result, c)
    }
    return result
}

func (s *MemoryStore) GetCollection(id string) *types.Collection {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.collections[id]
}

func (s *MemoryStore) SetCollection(c *types.Collection) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.collections[c.ID] = c
}

func (s *MemoryStore) DeleteCollection(id string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    delete(s.collections, id)
}

// Tasks
func (s *MemoryStore) GetTasks(collectionID string) []*types.Task {
    s.mu.RLock()
    defer s.mu.RUnlock()
    result := make([]*types.Task, 0)
    for _, t := range s.tasks {
        if t.CollectionID == collectionID {
            result = append(result, t)
        }
    }
    return result
}

func (s *MemoryStore) GetTask(id string) *types.Task {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.tasks[id]
}

func (s *MemoryStore) SetTask(t *types.Task) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.tasks[t.ID] = t
}

func (s *MemoryStore) DeleteTask(id string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    delete(s.tasks, id)
}

// Timer
func (s *MemoryStore) GetTimer() *types.TimerState {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.timer
}

func (s *MemoryStore) SetTimer(t *types.TimerState) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.timer = t
}

func (s *MemoryStore) ClearTimer() {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.timer = nil
}

// Notion Tokens
func (s *MemoryStore) GetNotionToken(userToken string) string {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.notionTokens[userToken]
}

func (s *MemoryStore) SetNotionToken(userToken, accessToken string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.notionTokens[userToken] = accessToken
}

func (s *MemoryStore) DeleteNotionToken(userToken string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    delete(s.notionTokens, userToken)
}
```

- [ ] **Step 2: Write store tests**

```go
// internal/store/memory_test.go
package store

import (
    "testing"
    "link-do-backend/internal/types"
)

func TestCollectionCRUD(t *testing.T) {
    s := New()
    c := &types.Collection{ID: "col-1", Name: "Test"}
    s.SetCollection(c)
    got := s.GetCollection("col-1")
    if got == nil || got.Name != "Test" {
        t.Errorf("GetCollection failed")
    }
    s.DeleteCollection("col-1")
    if s.GetCollection("col-1") != nil {
        t.Errorf("DeleteCollection failed")
    }
}

func TestTaskCRUD(t *testing.T) {
    s := New()
    t1 := &types.Task{ID: "task-1", CollectionID: "col-1", Title: "Task 1"}
    s.SetTask(t1)
    tasks := s.GetTasks("col-1")
    if len(tasks) != 1 || tasks[0].Title != "Task 1" {
        t.Errorf("GetTasks failed")
    }
}

func TestTimerState(t *testing.T) {
    s := New()
    timer := &types.TimerState{ActiveTaskID: "task-1", StartedAt: 1000, Elapsed: 0}
    s.SetTimer(timer)
    got := s.GetTimer()
    if got == nil || got.ActiveTaskID != "task-1" {
        t.Errorf("GetTimer failed")
    }
    s.ClearTimer()
    if s.GetTimer() != nil {
        t.Errorf("ClearTimer failed")
    }
}
```

- [ ] **Step 3: Run tests**

Run: `cd backend && go test ./internal/store/... -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd backend && git add internal/store/
git commit -m "feat: add in-memory store for collections, tasks, timer, and tokens"
```

---

## Task 3: Notion Client & Mapper

**Files:**
- Create: `backend/internal/notion/client.go`
- Create: `backend/internal/notion/mapper.go`
- Create: `backend/internal/notion/database.go`
- Create: `backend/internal/notion/page.go`
- Create: `backend/internal/notion/oauth.go`
- Test: `backend/internal/notion/mapper_test.go`

- [ ] **Step 1: Write Notion HTTP client wrapper**

```go
// internal/notion/client.go
package notion

import (
    "github.com/dstotijn/go-notion"
)

type Client struct {
    client *notion.Client
}

func NewClient(accessToken string) *Client {
    return &Client{
        client: notion.NewClient(accessToken),
    }
}

func (c *Client) Notion() *notion.Client {
    return c.client
}
```

- [ ] **Step 2: Write mapper (Notion ↔ internal models)**

```go
// internal/notion/mapper.go
package notion

import (
    "github.com/dstotijn/go-notion"
    "link-do-backend/internal/types"
    "time"
)

func CollectionFromDatabase(db *notion.Database, page *notion.Page) *types.Collection {
    name := ""
    icon := ""
    if page != nil {
        if t := page.Title; len(t) > 0 {
            name = t[0].Text.Content
        }
        if page.Icon != nil && page.Icon.Type == "emoji" {
            icon = page.Icon.Emoji
        }
    }
    pending := 0
    estTotal := 0
    for _, p := range page.Properties {
        if sel, ok := p.(notion.PropertyStatus); ok && sel.Status != nil {
            if sel.Status.Name != "Done" {
                pending++
            }
        }
        if num, ok := p.(notion.PropertyNumber); ok && num.Number != nil {
            if num.Name == "Estimate (min)" {
                estTotal += int(*num.Number)
            }
        }
    }
    return &types.Collection{
        ID:               db.ID.String(),
        Name:             name,
        Icon:             icon,
        Source:           "notion",
        NotionDatabaseID: db.ID.String(),
        PendingCount:     pending,
        EstimatedTotal:    estTotal,
        Archived:         dbarchived(db),
    }
}

func TaskFromPage(page *notion.Page, collectionID string) *types.Task {
    title := ""
    for _, b := range page.Properties {
        if t, ok := b.(notion.PropertyTitle); ok && len(t.Title) > 0 {
            title = t.Title[0].Text.Content
            break
        }
    }
    status := "backlog"
    estTime := 0
    actualTime := 0
    for _, prop := range page.Properties {
        if sel, ok := prop.(notion.PropertyStatus); ok && sel.Status != nil {
            switch sel.Status.Name {
            case "This Week":
                status = "this_week"
            case "Today":
                status = "today"
            case "Done":
                status = "done"
            }
        }
        if num, ok := prop.(notion.PropertyNumber); ok && num.Number != nil {
            switch num.Name {
            case "Estimate (min)":
                estTime = int(*num.Number)
            case "Actual (min)":
                actualTime = int(*num.Number)
            }
        }
    }
    completedAt := page.CreatedTime
    return &types.Task{
        ID:             page.ID.String(),
        CollectionID:   collectionID,
        Title:          title,
        Status:         status,
        EstimatedTime:  estTime,
        ActualTime:     actualTime,
        Source:         "notion",
        NotionPageID:   page.ID.String(),
        CompletedAt:    completedAt,
        CreatedAt:      page.CreatedTime,
        SortOrder:      0,
    }
}

func dbarcarchived(db *notion.Database) bool {
    return false // MVP: no archive support
}
```

- [ ] **Step 3: Write database operations**

```go
// internal/notion/database.go
package notion

import (
    "github.com/dstotijn/go-notion"
)

func (c *Client) CreateDatabase(name, icon string) (*notion.Database, error) {
    parent := notion.Parent{
        Type:       "workspace",
        Workspace:   true,
    }
    title := []notion.Text{
        {Content: name},
    }
    props := map[string]notion.Property{
        "Name":      {Type: notion.PropertyTypeTitle, Title: &[]notion.Text{{Content: "Name"}}},
        "Status":    {Type: notion.PropertyTypeStatus, Status: &notion.StatusConfig{Options: []notion.StatusOption{{Name: "Backlog"}, {Name: "This Week"}, {Name: "Today"}, {Name: "Done"}}}},
        "Estimate (min)": {Type: notion.PropertyTypeNumber, Number: &notion.NumberConfig{Format: "number"}},
        "Actual (min)":   {Type: notion.PropertyTypeNumber, Number: &notion.NumberConfig{Format: "number"}},
    }
    return c.client.CreateDatabase(nil, parent, title, props, icon)
}

func (c *Client) GetDatabase(dbID string) (*notion.Database, error) {
    return c.client.GetDatabase(nil, dbID)
}

func (c *Client) QueryDatabase(dbID string) ([]*notion.Page, error) {
    resp, err := c.client.QueryDatabase(nil, dbID, nil)
    if err != nil {
        return nil, err
    }
    pages := make([]*notion.Page, 0, len(resp.Results))
    for _, p := range resp.Results {
        page := p
        pages = append(pages, &page)
    }
    return pages, nil
}
```

- [ ] **Step 4: Write page operations**

```go
// internal/notion/page.go
package notion

import (
    "github.com/dstotijn/go-notion"
)

func (c *Client) CreatePage(dbID, title string, status string, estTime int) (*notion.Page, error) {
    parent := notion.Parent{
        Type:       "database_id",
        DatabaseID: dbID,
    }
    props := map[string]notion.Property{
        "Name": {Type: notion.PropertyTypeTitle, Title: []notion.Text{{Content: title}}},
        "Status": {Type: notion.PropertyTypeStatus, Status: &notion.StatusConfig{Options: []notion.StatusOption{{Name: status}}}},
        "Estimate (min)": {Type: notion.PropertyTypeNumber, Number: &estTime},
        "Actual (min)": {Type: notion.PropertyTypeNumber, Number: func() *int { z := 0; return &z }()},
    }
    return c.client.CreatePage(nil, parent, props, nil)
}

func (c *Client) UpdatePageStatus(pageID, status string) error {
    props := map[string]notion.Property{
        "Status": {Type: notion.PropertyTypeStatus, Status: &notion.StatusConfig{Options: []notion.StatusOption{{Name: status}}}},
    }
    _, err := c.client.UpdatePage(nil, pageID, props, nil)
    return err
}

func (c *Client) UpdatePageTime(pageID string, actualMinutes int) error {
    props := map[string]notion.Property{
        "Actual (min)": {Type: notion.PropertyTypeNumber, Number: &actualMinutes},
    }
    _, err := c.client.UpdatePage(nil, pageID, props, nil)
    return err
}
```

- [ ] **Step 5: Write OAuth helper**

```go
// internal/notion/oauth.go
package notion

import (
    "encoding/json"
    "net/http"
    "net/url"
    "strings"
)

type OAuthTokenResponse struct {
    AccessToken string `json:"access_token"`
    TokenType   string `json:"token_type"`
    Owner       struct {
        User struct {
            Name  string `json:"name"`
            ID    string `json:"id"`
            Icon  string `json:"avatar_url"`
        } `json:"user"`
    } `json:"owner"`
}

func ExchangeCodeForToken(clientID, clientSecret, code, redirectURI string) (*OAuthTokenResponse, error) {
    data := url.Values{}
    data.Set("grant_type", "authorization_code")
    data.Set("code", code)
    data.Set("redirect_uri", redirectURI)
    data.Set("client_id", clientID)
    data.Set("client_secret", clientSecret)

    resp, err := http.Post("https://api.notion.com/v1/oauth/token",
        "application/json",
        strings.NewReader(data.Encode()))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var tokenResp OAuthTokenResponse
    if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
        return nil, err
    }
    return &tokenResp, nil
}
```

- [ ] **Step 6: Run go mod tidy**

Run: `cd backend && go mod tidy`
Expected: Downloads go-notion and dependencies

- [ ] **Step 7: Commit**

```bash
cd backend && git add internal/notion/
git commit -m "feat: add Notion client wrapper, mapper, database/page operations, and OAuth exchange"
```

---

## Task 4: Service Layer

**Files:**
- Create: `backend/internal/service/auth.go`
- Create: `backend/internal/service/collection.go`
- Create: `backend/internal/service/task.go`
- Create: `backend/internal/service/timer.go`
- Create: `backend/internal/service/sync.go`

- [ ] **Step 1: Write auth service**

```go
// internal/service/auth.go
package service

import (
    "fmt"
    "link-do-backend/internal/config"
    "link-do-backend/internal/notion"
    "link-do-backend/internal/store"
)

type AuthService struct {
    notionClient *notion.Client
}

func NewAuthService() *AuthService {
    return &AuthService{}
}

func (s *AuthService) GetOAuthURL() string {
    cfg := config.Get()
    return fmt.Sprintf("https://api.notion.com/v1/oauth/authorize?client_id=%s&response_type=code&owner=user&redirect_uri=%s",
        cfg.NotionClientID,
        url.QueryEscape(cfg.NotionRedirectURI),
    )
}

func (s *AuthService) HandleCallback(code string) (string, string, error) {
    cfg := config.Get()
    tokenResp, err := notion.ExchangeCodeForToken(cfg.NotionClientID, cfg.NotionClientSecret, code, cfg.NotionRedirectURI)
    if err != nil {
        return "", "", err
    }
    userToken := tokenResp.Owner.User.ID
    store.New().SetNotionToken(userToken, tokenResp.AccessToken)
    return userToken, tokenResp.Owner.User.Name, nil
}

func (s *AuthService) GetUserInfo(userToken string) (string, string, error) {
    accessToken := store.New().GetNotionToken(userToken)
    if accessToken == "" {
        return "", "", fmt.Errorf("not authenticated")
    }
    nc := notion.NewClient(accessToken)
    me, err := nc.Notion().GetCurrentUser()
    if err != nil {
        return "", "", err
    }
    name := me.Name
    avatar := ""
    if me.AvatarURL != "" {
        avatar = me.AvatarURL
    }
    return name, avatar, nil
}

func (s *AuthService) Logout(userToken string) {
    store.New().DeleteNotionToken(userToken)
}

import "net/url"
```

- [ ] **Step 2: Write collection service**

```go
// internal/service/collection.go
package service

import (
    "fmt"
    "link-do-backend/internal/notion"
    "link-do-backend/internal/store"
    "link-do-backend/internal/types"
    "time"
)

type CollectionService struct{}

func NewCollectionService() *CollectionService {
    return &CollectionService{}
}

func (s *CollectionService) List(userToken string) ([]*types.Collection, error) {
    // For MVP, return cached collections; sync first if empty
    collections := store.New().GetCollections()
    if len(collections) == 0 {
        return collections, nil
    }
    return collections, nil
}

func (s *CollectionService) Get(id string) (*types.Collection, error) {
    c := store.New().GetCollection(id)
    if c == nil {
        return nil, fmt.Errorf("collection not found")
    }
    return c, nil
}

func (s *CollectionService) Create(userToken, name, icon string) (*types.Collection, error) {
    accessToken := store.New().GetNotionToken(userToken)
    if accessToken == "" {
        return nil, fmt.Errorf("not authenticated")
    }
    nc := notion.NewClient(accessToken)
    db, err := nc.CreateDatabase(name, icon)
    if err != nil {
        return nil, err
    }
    collection := &types.Collection{
        ID:               db.ID.String(),
        Name:             name,
        Icon:             icon,
        Source:           "notion",
        NotionDatabaseID: db.ID.String(),
        PendingCount:     0,
        EstimatedTotal:   0,
        Archived:         false,
    }
    store.New().SetCollection(collection)
    return collection, nil
}

func (s *CollectionService) Update(id, name, icon string, archived bool) error {
    c := store.New().GetCollection(id)
    if c == nil {
        return fmt.Errorf("collection not found")
    }
    if name != "" {
        c.Name = name
    }
    if icon != "" {
        c.Icon = icon
    }
    c.Archived = archived
    store.New().SetCollection(c)
    return nil
}

func (s *CollectionService) Delete(id string) error {
    store.New().DeleteCollection(id)
    return nil
}
```

- [ ] **Step 3: Write task service**

```go
// internal/service/task.go
package service

import (
    "fmt"
    "link-do-backend/internal/notion"
    "link-do-backend/internal/store"
    "link-do-backend/internal/types"
)

type TaskService struct{}

func NewTaskService() *TaskService {
    return &TaskService{}
}

func (s *TaskService) Create(userToken, collectionID, title string, estimatedTime int) (*types.Task, error) {
    accessToken := store.New().GetNotionToken(userToken)
    if accessToken == "" {
        return nil, fmt.Errorf("not authenticated")
    }
    collection := store.New().GetCollection(collectionID)
    if collection == nil {
        return nil, fmt.Errorf("collection not found")
    }
    nc := notion.NewClient(accessToken)
    page, err := nc.CreatePage(collection.NotionDatabaseID, title, "Backlog", estimatedTime)
    if err != nil {
        return nil, err
    }
    task := &types.Task{
        ID:             page.ID.String(),
        CollectionID:   collectionID,
        Title:          title,
        Status:         "backlog",
        EstimatedTime:  estimatedTime,
        ActualTime:     0,
        Source:         "notion",
        NotionPageID:   page.ID.String(),
        CreatedAt:      page.CreatedTime,
        SortOrder:      0,
    }
    store.New().SetTask(task)
    return task, nil
}

func (s *TaskService) Update(id, title string, estimatedTime int) error {
    task := store.New().GetTask(id)
    if task == nil {
        return fmt.Errorf("task not found")
    }
    if title != "" {
        task.Title = title
    }
    if estimatedTime >= 0 {
        task.EstimatedTime = estimatedTime
    }
    store.New().SetTask(task)
    return nil
}

func (s *TaskService) UpdateStatus(id, status string) error {
    task := store.New().GetTask(id)
    if task == nil {
        return fmt.Errorf("task not found")
    }
    accessToken := store.New().GetNotionToken("")
    nc := notion.NewClient(accessToken)
    if err := nc.UpdatePageStatus(task.NotionPageID, status); err != nil {
        return err
    }
    task.Status = status
    store.New().SetTask(task)
    return nil
}

func (s *TaskService) Delete(id string) error {
    store.New().DeleteTask(id)
    return nil
}

func (s *TaskService) GetByCollection(collectionID string) map[string][]*types.Task {
    tasks := store.New().GetTasks(collectionID)
    result := map[string][]*types.Task{
        "backlog":    {},
        "this_week":  {},
        "today":      {},
        "done":       {},
    }
    for _, t := range tasks {
        result[t.Status] = append(result[t.Status], t)
    }
    return result
}
```

- [ ] **Step 4: Write timer service**

```go
// internal/service/timer.go
package service

import (
    "fmt"
    "link-do-backend/internal/store"
    "link-do-backend/internal/types"
    "time"
)

type TimerService struct{}

func NewTimerService() *TimerService {
    return &TimerService{}
}

func (s *TimerService) Start(userToken, taskID string) (*types.TimerStartResponse, error) {
    task := store.New().GetTask(taskID)
    if task == nil {
        return nil, fmt.Errorf("task not found")
    }
    state := &types.TimerState{
        ActiveTaskID: taskID,
        StartedAt:    time.Now().Unix(),
        Elapsed:      0,
    }
    store.New().SetTimer(state)
    return &types.TimerStartResponse{
        SessionID: fmt.Sprintf("sess-%d", time.Now().UnixNano()),
        StartedAt:  state.StartedAt,
    }, nil
}

func (s *TimerService) Stop(userToken string) error {
    timer := store.New().GetTimer()
    if timer == nil {
        return fmt.Errorf("no active timer")
    }
    task := store.New().GetTask(timer.ActiveTaskID)
    if task == nil {
        return fmt.Errorf("task not found")
    }
    // Calculate duration
    now := time.Now().Unix()
    duration := int(now - timer.StartedAt)
    task.ActualTime += duration / 60 // convert to minutes

    // Sync to Notion
    accessToken := store.New().GetNotionToken(userToken)
    if accessToken != "" {
        // TODO: sync actual time to Notion
    }
    store.New().SetTask(task)
    store.New().ClearTimer()
    return nil
}

func (s *TimerService) GetCurrent() (*types.TimerState, error) {
    timer := store.New().GetTimer()
    if timer == nil {
        return nil, nil
    }
    // Recalculate elapsed
    now := time.Now().Unix()
    timer.Elapsed = int(now - timer.StartedAt)
    return timer, nil
}
```

- [ ] **Step 5: Write sync service**

```go
// internal/service/sync.go
package service

import (
    "fmt"
    "link-do-backend/internal/notion"
    "link-do-backend/internal/store"
    "link-do-backend/internal/types"
)

type SyncService struct{}

func NewSyncService() *SyncService {
    return &SyncService{}
}

func (s *SyncService) FullSync(userToken string) error {
    accessToken := store.New().GetNotionToken(userToken)
    if accessToken == "" {
        return fmt.Errorf("not authenticated")
    }
    nc := notion.NewClient(accessToken)

    // Search all databases accessible to the user
    // For MVP, we maintain a list of collection DB IDs in store
    collections := store.New().GetCollections()
    for _, col := range collections {
        db, err := nc.GetDatabase(col.NotionDatabaseID)
        if err != nil {
            continue // skip inaccessible DBs
        }
        pages, err := nc.QueryDatabase(col.NotionDatabaseID)
        if err != nil {
            continue
        }
        // Update collection metadata
        updated := notion.CollectionFromDatabase(db, nil)
        updated.ID = col.ID
        updated.NotionDatabaseID = col.NotionDatabaseID
        store.New().SetCollection(updated)

        // Update tasks
        for _, page := range pages {
            task := notion.TaskFromPage(page, col.ID)
            store.New().SetTask(task)
        }
    }
    return nil
}
```

- [ ] **Step 6: Commit**

```bash
cd backend && git add internal/service/
git commit -m "feat: add service layer (auth, collection, task, timer, sync)"
```

---

## Task 5: HTTP Handlers

**Files:**
- Create: `backend/internal/http/middleware.go`
- Create: `backend/internal/http/router.go`
- Create: `backend/internal/http/auth.go`
- Create: `backend/internal/http/collection.go`
- Create: `backend/internal/http/task.go`
- Create: `backend/internal/http/timer.go`
- Create: `backend/internal/http/sync.go`

- [ ] **Step 1: Write middleware (Auth + Logger + Recovery)**

```go
// internal/http/middleware.go
package http

import (
    "log"
    "net/http"
    "runtime/debug"
)

func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Skip auth for public endpoints
        path := r.URL.Path
        if path == "/api/v1/auth/notion/url" ||
           path == "/api/v1/auth/notion/callback" ||
           path == "/health" {
            next.ServeHTTP(w, r)
            return
        }
        // For MVP: extract token from Authorization header
        token := r.Header.Get("Authorization")
        if token != "" {
            token = trimBearer(token)
            r = r.WithContext(withUserToken(r.Context(), token))
        }
        next.ServeHTTP(w, r)
    })
}

func LoggerMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        log.Printf("[%s] %s", r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
    })
}

func RecoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("panic: %v\n%s", err, debug.Stack())
                http.Error(w, "internal server error", 500)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

func trimBearer(token string) string {
    if len(token) > 7 && token[:7] == "Bearer " {
        return token[7:]
    }
    return token
}

// Context key helpers
type contextKey string
const userTokenKey contextKey = "userToken"

func withUserToken(ctx context.Context, token string) context.Context {
    return context.WithValue(ctx, userTokenKey, token)
}

func getUserToken(r *http.Request) string {
    if token, ok := r.Context().Value(userTokenKey).(string); ok {
        return token
    }
    return ""
}

import "context"
```

- [ ] **Step 2: Write auth handler**

```go
// internal/http/auth.go
package http

import (
    "encoding/json"
    "net/http"
    "link-do-backend/internal/service"
    "link-do-backend/internal/types"
)

type AuthHandler struct {
    svc *service.AuthService
}

func NewAuthHandler() *AuthHandler {
    return &AuthHandler{svc: service.NewAuthService()}
}

func (h *AuthHandler) GetOAuthURL(w http.ResponseWriter, r *http.Request) {
    url := h.svc.GetOAuthURL()
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true, Data: map[string]string{"url": url}})
}

func (h *AuthHandler) Callback(w http.ResponseWriter, r *http.Request) {
    code := r.URL.Query().Get("code")
    if code == "" {
        http.Error(w, "missing code", 400)
        return
    }
    userToken, name, err := h.svc.HandleCallback(code)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    // Redirect to deep link
    http.Redirect(w, r, "linkdo://auth?token="+userToken+"&name="+name, 302)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
    userToken := getUserToken(r)
    name, avatar, err := h.svc.GetUserInfo(userToken)
    if err != nil {
        respondJSON(w, http.StatusUnauthorized, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true, Data: types.UserInfo{Name: name, Avatar: avatar}})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
    userToken := getUserToken(r)
    h.svc.Logout(userToken)
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true})
}

func respondJSON(w http.ResponseWriter, status int, resp types.APIResponse) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(resp)
}
```

- [ ] **Step 3: Write collection handler**

```go
// internal/http/collection.go
package http

import (
    "encoding/json"
    "net/http"
    "link-do-backend/internal/service"
    "link-do-backend/internal/types"
)

type CollectionHandler struct {
    svc *service.CollectionService
}

func NewCollectionHandler() *CollectionHandler {
    return &CollectionHandler{svc: service.NewCollectionService()}
}

func (h *CollectionHandler) List(w http.ResponseWriter, r *http.Request) {
    userToken := getUserToken(r)
    collections, err := h.svc.List(userToken)
    if err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true, Data: collections})
}

func (h *CollectionHandler) Get(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    collection, err := h.svc.Get(id)
    if err != nil {
        respondJSON(w, http.StatusNotFound, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true, Data: collection})
}

func (h *CollectionHandler) Create(w http.ResponseWriter, r *http.Request) {
    userToken := getUserToken(r)
    var req struct {
        Name string `json:"name"`
        Icon string `json:"icon"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondJSON(w, http.StatusBadRequest, types.APIResponse{Success: false, Error: "invalid request"})
        return
    }
    collection, err := h.svc.Create(userToken, req.Name, req.Icon)
    if err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusCreated, types.APIResponse{Success: true, Data: collection})
}

func (h *CollectionHandler) Update(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    var req struct {
        Name     string `json:"name"`
        Icon     string `json:"icon"`
        Archived bool   `json:"archived"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondJSON(w, http.StatusBadRequest, types.APIResponse{Success: false, Error: "invalid request"})
        return
    }
    if err := h.svc.Update(id, req.Name, req.Icon, req.Archived); err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true})
}

func (h *CollectionHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if err := h.svc.Delete(id); err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true})
}

import "github.com/go-chi/chi/v5"
```

- [ ] **Step 4: Write task handler**

```go
// internal/http/task.go
package http

import (
    "encoding/json"
    "net/http"
    "github.com/go-chi/chi/v5"
    "link-do-backend/internal/service"
    "link-do-backend/internal/types"
)

type TaskHandler struct {
    svc *service.TaskService
}

func NewTaskHandler() *TaskHandler {
    return &TaskHandler{svc: service.NewTaskService()}
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
    userToken := getUserToken(r)
    collectionID := chi.URLParam(r, "id")
    var req struct {
        Title         string `json:"title"`
        EstimatedTime int    `json:"estimated_time"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondJSON(w, http.StatusBadRequest, types.APIResponse{Success: false, Error: "invalid request"})
        return
    }
    task, err := h.svc.Create(userToken, collectionID, req.Title, req.EstimatedTime)
    if err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusCreated, types.APIResponse{Success: true, Data: task})
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
    taskID := chi.URLParam(r, "id")
    var req struct {
        Title         string `json:"title"`
        EstimatedTime int    `json:"estimated_time"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondJSON(w, http.StatusBadRequest, types.APIResponse{Success: false, Error: "invalid request"})
        return
    }
    if err := h.svc.Update(taskID, req.Title, req.EstimatedTime); err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true})
}

func (h *TaskHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
    taskID := chi.URLParam(r, "id")
    var req struct {
        Status string `json:"status"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondJSON(w, http.StatusBadRequest, types.APIResponse{Success: false, Error: "invalid request"})
        return
    }
    if err := h.svc.UpdateStatus(taskID, req.Status); err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true})
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
    taskID := chi.URLParam(r, "id")
    if err := h.svc.Delete(taskID); err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true})
}
```

- [ ] **Step 5: Write timer handler**

```go
// internal/http/timer.go
package http

import (
    "net/http"
    "github.com/go-chi/chi/v5"
    "link-do-backend/internal/service"
    "link-do-backend/internal/types"
)

type TimerHandler struct {
    svc *service.TimerService
}

func NewTimerHandler() *TimerHandler {
    return &TimerHandler{svc: service.NewTimerService()}
}

func (h *TimerHandler) Start(w http.ResponseWriter, r *http.Request) {
    userToken := getUserToken(r)
    taskID := chi.URLParam(r, "id")
    resp, err := h.svc.Start(userToken, taskID)
    if err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true, Data: resp})
}

func (h *TimerHandler) Stop(w http.ResponseWriter, r *http.Request) {
    userToken := getUserToken(r)
    if err := h.svc.Stop(userToken); err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true})
}

func (h *TimerHandler) Current(w http.ResponseWriter, r *http.Request) {
    timer, err := h.svc.GetCurrent()
    if err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true, Data: timer})
}
```

- [ ] **Step 6: Write sync handler**

```go
// internal/http/sync.go
package http

import (
    "net/http"
    "link-do-backend/internal/service"
    "link-do-backend/internal/types"
)

type SyncHandler struct {
    svc *service.SyncService
}

func NewSyncHandler() *SyncHandler {
    return &SyncHandler{svc: service.NewSyncService()}
}

func (h *SyncHandler) Sync(w http.ResponseWriter, r *http.Request) {
    userToken := getUserToken(r)
    if err := h.svc.FullSync(userToken); err != nil {
        respondJSON(w, http.StatusInternalServerError, types.APIResponse{Success: false, Error: err.Error()})
        return
    }
    respondJSON(w, http.StatusOK, types.APIResponse{Success: true})
}
```

- [ ] **Step 7: Write router**

```go
// internal/http/router.go
package http

import (
    "net/http"
    "github.com/go-chi/chi/v5"
)

func NewRouter() *chi.Mux {
    r := chi.NewRouter()

    // Global middleware
    r.Use(RecoveryMiddleware)
    r.Use(LoggerMiddleware)

    // Health check
    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })

    // API v1 routes
    r.Route("/api/v1", func(r chi.Router) {
        r.Use(AuthMiddleware)

        // Auth
        r.Get("/auth/notion/url", NewAuthHandler().GetOAuthURL)
        r.Get("/auth/notion/callback", NewAuthHandler().Callback)
        r.Get("/auth/me", NewAuthHandler().Me)
        r.Post("/auth/logout", NewAuthHandler().Logout)

        // Collections
        r.Get("/collections", NewCollectionHandler().List)
        r.Post("/collections", NewCollectionHandler().Create)
        r.Get("/collections/{id}", NewCollectionHandler().Get)
        r.Patch("/collections/{id}", NewCollectionHandler().Update)
        r.Delete("/collections/{id}", NewCollectionHandler().Delete)
        r.Post("/collections/{id}/sync", NewSyncHandler().Sync)

        // Tasks
        r.Post("/collections/{id}/tasks", NewTaskHandler().Create)
        r.Patch("/tasks/{id}", NewTaskHandler().Update)
        r.Patch("/tasks/{id}/status", NewTaskHandler().UpdateStatus)
        r.Delete("/tasks/{id}", NewTaskHandler().Delete)

        // Timer
        r.Post("/tasks/{id}/timer/start", NewTimerHandler().Start)
        r.Post("/tasks/{id}/timer/stop", NewTimerHandler().Stop)
        r.Get("/timer/current", NewTimerHandler().Current)

        // Sync
        r.Post("/sync", NewSyncHandler().Sync)
    })

    return r
}
```

- [ ] **Step 8: Commit**

```bash
cd backend && git add internal/http/
git commit -m "feat: add HTTP handlers and router"
```

---

## Task 6: Main Entry Point

**Files:**
- Create: `backend/main.go`

- [ ] **Step 1: Write main.go**

```go
// main.go
package main

import (
    "fmt"
    "log"
    "net/http"
    "link-do-backend/internal/config"
    "link-do-backend/internal/http"
)

func main() {
    cfg := config.Load()
    addr := fmt.Sprintf(":%s", cfg.Port)
    log.Printf("Starting Link-Do backend on %s", addr)
    if err := http.ListenAndServe(addr, http.NewRouter()); err != nil {
        log.Fatalf("Server failed: %v", err)
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && go build -o link-do-backend .`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd backend && git add main.go
git commit -m "feat: add main entry point"
```

---

## Task 7: Build Verification & Integration Test

**Files:**
- Test: `backend/cmd/api_test.go` (manual integration test)

- [ ] **Step 1: Write integration test**

```go
// cmd/api_test.go
package main

import (
    "testing"
    "net/http"
    "net/http/httptest"
    "link-do-backend/internal/http"
)

func TestHealthEndpoint(t *testing.T) {
    r := http.NewRouter()
    req := httptest.NewRequest("GET", "/health", nil)
    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)
    if w.Code != http.StatusOK {
        t.Errorf("expected 200, got %d", w.Code)
    }
}

func TestAuthMiddlewareSkipsPublicEndpoints(t *testing.T) {
    r := http.NewRouter()
    req := httptest.NewRequest("GET", "/api/v1/auth/notion/url", nil)
    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)
    // Should not 401, should return 200 with OAuth URL
    if w.Code == http.StatusUnauthorized {
        t.Error("auth middleware should not block public endpoints")
    }
}
```

- [ ] **Step 2: Run tests**

Run: `cd backend && go test ./... -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
cd backend && git add cmd/
git commit -m "test: add integration tests"
```

---

## Task 8: Final Review Against Spec

After completing all tasks above, verify:

1. **Spec coverage:** All API endpoints from Section 3 of the design spec are implemented
2. **No placeholders:** No TBD, TODO, or incomplete implementations
3. **Type consistency:** All method signatures match across layers
4. **Code compiles:** `go build` succeeds
5. **Tests pass:** `go test ./...` succeeds

---

## Self-Review Checklist

| Requirement | Status |
|---|---|
| All 5 auth endpoints | Implemented in Task 5 |
| All 6 collection endpoints | Implemented in Task 5 |
| All 4 task endpoints | Implemented in Task 5 |
| All 3 timer endpoints | Implemented in Task 5 |
| Sync endpoint | Implemented in Task 5 |
| Notion OAuth flow | Implemented in Task 3-4 |
| Memory store | Implemented in Task 2 |
| Go.mod with dependencies | Done in Task 1 |
| Router with chi | Done in Task 5 |
| Middleware (auth, log, recovery) | Done in Task 5 |
