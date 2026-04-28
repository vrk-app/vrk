package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Server        ServerConfig
	Database      DatabaseConfig
	PlatformAdmin PlatformAdminConfig
}

type ServerConfig struct {
	Port        int
	Environment string
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type PlatformAdminConfig struct {
	SharedSecret string
}

func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	cfg := &Config{
		Server: ServerConfig{
			Port:        getEnvAsInt("SERVER_PORT", 8080),
			Environment: getEnv("ENVIRONMENT", "development"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "equipment_db"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		PlatformAdmin: PlatformAdminConfig{
			SharedSecret: strings.TrimSpace(os.Getenv("PLATFORM_ADMIN_SHARED_SECRET")),
		},
	}

	if cfg.PlatformAdmin.SharedSecret == "" {
		return nil, fmt.Errorf("PLATFORM_ADMIN_SHARED_SECRET is required")
	}

	return cfg, nil
}

func (c *Config) GetDSN() string {
	return c.Database.GetDSN()
}

func (db *DatabaseConfig) GetDSN() string {
	return "host=" + db.Host +
		" port=" + strconv.Itoa(db.Port) +
		" user=" + db.User +
		" password=" + db.Password +
		" dbname=" + db.DBName +
		" sslmode=" + db.SSLMode
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
