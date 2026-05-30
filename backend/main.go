package main

import (
	"fmt"
	"log"

	"link-do-backend/internal/config"
	"link-do-backend/internal/database"
	httprouter "link-do-backend/internal/http"
	"link-do-backend/internal/repository"
	"link-do-backend/internal/service"
)

func main() {
	cfg := config.Load()

	// Connect to MySQL
	db, err := database.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to MySQL: %v", err)
	}

	// // Auto-migrate
	// if err := database.Migrate(db); err != nil {
	// 	log.Fatalf("Failed to migrate: %v", err)
	// }

	// Connect to Redis
	redisSvc, err := service.NewRedisService()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// Init repositories
	userRepo := repository.NewUserRepository(db)
	collectionRepo := repository.NewCollectionRepository(db)
	taskRepo := repository.NewTaskRepository(db)
	timerRepo := repository.NewTimerRepository(db)
	notionDBRepo := repository.NewNotionDatabaseRepository(db)

	// Init services
	emailSvc := service.NewEmailService()
	jwtSvc := service.NewJWTService()
	notionSvc := service.NewNotionService(userRepo, notionDBRepo)
	authSvc := service.NewAuthService(userRepo, redisSvc, emailSvc, jwtSvc)
	collectionSvc := service.NewCollectionService(collectionRepo, taskRepo, notionSvc)
	notionDBSvc := service.NewNotionDatabaseService(notionDBRepo, collectionRepo, notionSvc)
	taskSvc := service.NewTaskService(taskRepo, collectionRepo, notionDBSvc, notionSvc)
	timerSvc := service.NewTimerService(timerRepo, taskRepo)
	syncSvc := service.NewSyncService(notionDBRepo)
	mcpOAuthSvc := service.NewMcpOAuthService(userRepo, redisSvc, jwtSvc)

	// Build router
	app := httprouter.NewRouter(authSvc, collectionSvc, notionDBSvc, notionSvc, taskSvc, timerSvc, syncSvc, mcpOAuthSvc)
	httprouter.SetUserRepo(userRepo)
	httprouter.SetJWTService(jwtSvc)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Starting Link-Do backend on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
