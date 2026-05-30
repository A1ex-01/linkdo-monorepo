package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

var cfg *Config

type Config struct {
	MySQLDSN           string
	NotionClientID     string
	NotionClientSecret string
	NotionRedirectURI  string
	NotionAccessToken  string
	SMTPHost           string
	SMTPPort           string
	SMTPUsername       string
	SMTPPassword       string
	SMTPFrom           string
	SMTPUseTLS         bool
	RedisAddr          string
	RedisPassword      string
	RedisDB            int
	JWTSecret          string
	Port               string
	Debug              bool
}

func Load() *Config {
	// Try loading from backend/.env first, then current dir
	godotenv.Load("backend/.env")
	godotenv.Load()
	cfg = &Config{
		MySQLDSN:           os.Getenv("MYSQL_DSN"),
		NotionClientID:     os.Getenv("NOTION_CLIENT_ID"),
		NotionClientSecret: os.Getenv("NOTION_CLIENT_SECRET"),
		NotionRedirectURI:  os.Getenv("NOTION_REDIRECT_URI"),
		SMTPHost:           os.Getenv("SMTP_HOST"),
		SMTPPort:           os.Getenv("SMTP_PORT"),
		SMTPUsername:       os.Getenv("SMTP_USERNAME"),
		SMTPPassword:       os.Getenv("SMTP_PASSWORD"),
		SMTPFrom:           os.Getenv("SMTP_FROM"),
		SMTPUseTLS:         os.Getenv("SMTP_USE_TLS") == "true",
		RedisAddr:          os.Getenv("REDIS_ADDR"),
		RedisPassword:      os.Getenv("REDIS_PASSWORD"),
		RedisDB:            0,
		JWTSecret:          os.Getenv("JWT_SECRET"),
		Port:               os.Getenv("PORT"),
		Debug:              os.Getenv("DEBUG") == "true",
	}
	log.Printf("[CONFIG] NOTION_CLIENT_ID=%s", cfg.NotionClientID)
	log.Printf("[CONFIG] NOTION_CLIENT_SECRET=%s", cfg.NotionClientSecret)
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.MySQLDSN == "" {
		cfg.MySQLDSN = "root:password@tcp(localhost:3306)/linkdo?charset=utf8mb4&parseTime=True&loc=Local"
	}
	if cfg.RedisAddr == "" {
		cfg.RedisAddr = "localhost:6379"
	}
	if cfg.JWTSecret == "" {
		cfg.JWTSecret = "link-do-jwt-secret-change-in-production"
	}
	return cfg
}

func Get() *Config {
	return cfg
}
