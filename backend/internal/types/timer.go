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
