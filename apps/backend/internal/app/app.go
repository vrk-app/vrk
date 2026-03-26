package app

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"backend/internal/auth"
	"backend/internal/pkg/config"
	"backend/internal/pkg/db"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type App struct {
	server *http.Server
	router *chi.Mux
	db     *sql.DB
	cfg    *config.Config
}

func New(cfg *config.Config) (*App, error) {
	// Подключение к БД
	database, err := db.Connect(cfg.GetDSN())
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Инициализация модулей
	authHandler := auth.NewHandler()

	// router
	router := chi.NewRouter()

	// Middleware
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.RequestID)

	// Routes
	router.Get("/ping", authHandler.PingHandler)

	// Настройка сервера
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return &App{
		server: server,
		router: router,
		db:     database,
		cfg:    cfg,
	}, nil
}

func (a *App) Run(ctx context.Context) error {
	errCh := make(chan error, 1)
	go func() {
		if err := a.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- fmt.Errorf("server error: %w", err)
		}
	}()

	select {
	case <-ctx.Done():
		return a.Shutdown(context.Background())
	case err := <-errCh:
		return err
	}
}

func (a *App) Shutdown(ctx context.Context) error {
	log.Println("Stopping server...")

	if err := db.Close(a.db); err != nil {
		log.Printf("Error closing database: %v", err)
	}

	return a.server.Shutdown(ctx)
}

// GetDB возвращает подключение к БД
func (a *App) GetDB() *sql.DB {
	return a.db
}