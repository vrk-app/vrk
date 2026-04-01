package app

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	httpSwagger "github.com/swaggo/http-swagger"

	"backend/internal/db/generated"
    "backend/internal/auth/organization"
	"backend/internal/equipment/equipment"
	"backend/internal/equipment/measuringinstrument"
	"backend/internal/equipment/standard"
	"backend/internal/infrastructure/config"
	"backend/internal/infrastructure/db"

	_ "backend/docs/swagger"
)

type App struct {
	server *http.Server
	router *chi.Mux
	db     *pgxpool.Pool
	cfg    *config.Config
}

func New(cfg *config.Config) (*App, error) {
	// Подключение к БД
	ctx := context.Background()
	database, err := db.Connect(ctx, cfg.GetDSN())
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

    // Создание sqlc queries
    queries := generated.New(database)

    // Инициализация репозиториев и сервисов
    // Organization
    orgRepo := organization.NewRepository(queries)
    orgService := organization.NewService(orgRepo)
    orgHandler := organization.NewHandler(orgService)

    // Equipment
    eqRepo := equipment.NewRepository(queries)
    eqService := equipment.NewService(eqRepo)
    eqHandler := equipment.NewHandler(eqService)

    // Standard
    stdRepo := standard.NewRepository(queries)
    stdService := standard.NewService(stdRepo)
    stdHandler := standard.NewHandler(stdService)

    // Measuring Instrument
    miRepo := measuringinstrument.NewRepository(queries)
    miService := measuringinstrument.NewService(miRepo)
    miHandler := measuringinstrument.NewHandler(miService)


	// router
	router := chi.NewRouter()

	// Middleware
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)

	// Routes
	registerRoutes(router, orgHandler, eqHandler, stdHandler, miHandler)

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

func registerRoutes(r *chi.Mux,
					organizationHandler *organization.OrganizationHandler,
					eqHandler *equipment.EquipmentHandler,
					stdHandler *standard.StandardHandler,
					miHandler *measuringinstrument.MeasuringInstrumentHandler,
					) {
	// Swagger UI
    r.Get("/swagger/*", httpSwagger.Handler(
        httpSwagger.URL("/swagger/doc.json"),
    ))
    r.Route("/api/v1", func(r chi.Router) {
		// Organizations
        r.Route("/organizations", func(r chi.Router) {
            r.Get("/", organizationHandler.List)
            r.Post("/", organizationHandler.Create)
			r.Get("/{id}", organizationHandler.GetByID)
			r.Patch("/{id}", organizationHandler.Update)
			r.Delete("/{id}", organizationHandler.Delete)
        })
		// Equipment
        r.Route("/equipment", func(r chi.Router) {
            r.Get("/", eqHandler.List)
            r.Post("/", eqHandler.Create)
            r.Get("/{id}", eqHandler.GetByID)
            r.Patch("/{id}", eqHandler.Update)
            r.Delete("/{id}", eqHandler.Delete)
        })
		// Standards
        r.Route("/standards", func(r chi.Router) {
            r.Get("/", stdHandler.List)
            r.Post("/", stdHandler.Create)
            r.Get("/{id}", stdHandler.GetByID)
            r.Patch("/{id}", stdHandler.Update)
            r.Delete("/{id}", stdHandler.Delete)
        })
		// Measuring Instruments
        r.Route("/measuring-instruments", func(r chi.Router) {
            r.Get("/", miHandler.List)
            r.Post("/", miHandler.Create)
            r.Get("/{id}", miHandler.GetByID)
            r.Patch("/{id}", miHandler.Update)
            r.Delete("/{id}", miHandler.Delete)
        })
    })
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

    if a.db != nil {
        a.db.Close()
    }

    return a.server.Shutdown(ctx)
}
