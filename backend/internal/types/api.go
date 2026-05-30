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
