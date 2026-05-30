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

var (
    global   *MemoryStore
    initOnce sync.Once
)

func New() *MemoryStore {
    initOnce.Do(func() {
        global = &MemoryStore{
            collections:  make(map[string]*types.Collection),
            tasks:        make(map[string]*types.Task),
            notionTokens: make(map[string]string),
        }
    })
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