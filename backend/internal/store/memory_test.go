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