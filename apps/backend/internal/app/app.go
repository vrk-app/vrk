package app

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	httpSwagger "github.com/swaggo/http-swagger"

	_ "backend/docs/swagger"
	"backend/internal/application/agreement"
	"backend/internal/auth/organization"
	"backend/internal/db/generated"
	"backend/internal/equipment/equipment"
	"backend/internal/equipment/manufacturer"
	"backend/internal/equipment/equipmentdictionary"
	"backend/internal/equipment/usageclassification"
    "backend/internal/equipment/metrologicaltype"
	// "backend/internal/equipment/measuringinstrument"
	// "backend/internal/equipment/standard"
	"backend/internal/infrastructure/config"
	"backend/internal/infrastructure/db"
)

type App struct {
	server *http.Server
	router *chi.Mux
	db     *pgxpool.Pool
	cfg    *config.Config
	logger *slog.Logger
}

func New(cfg *config.Config) (*App, error) {
	// logger живет внутри App, чтобы startup/shutdown, readiness и request logs
	// писались в один structured stream, который потом собирают compose и CI.
	logger := slog.Default().With("service", "backend")

	// Подключение к БД
	ctx := context.Background()
	database, err := db.Connect(ctx, cfg.GetDSN())
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	logger.Info(
		"database_ready",
		"database", cfg.Database.DBName,
		"host", cfg.Database.Host,
		"port", cfg.Database.Port,
	)

	// Создание sqlc queries
	queries := generated.New(database)

	// Инициализация репозиториев и сервисов
	orgRepo := organization.NewRepository(queries)
	orgService := organization.NewService(orgRepo)
	orgHandler := organization.NewHandler(orgService)

	eqRepo := equipment.NewRepository(queries)
	eqService := equipment.NewService(eqRepo)
	eqHandler := equipment.NewHandler(eqService)


	agreementRepo := agreement.NewRepository(queries)
	agreementService := agreement.NewService(agreementRepo)
	agreementHandler := agreement.NewHandler(agreementService)

	usageClassRepo := usageclassification.NewRepository(queries)
	usageClassService := usageclassification.NewService(usageClassRepo)
	usageClassHandler := usageclassification.NewHandler(usageClassService)

	metrologicalTypeRepo := metrologicaltype.NewRepository(queries)
	metrologicalTypeService := metrologicaltype.NewService(metrologicalTypeRepo)
	metrologicalTypeHandler := metrologicaltype.NewHandler(metrologicalTypeService)

	manufacturerRepo := manufacturer.NewRepository(queries)
	manufacturerService := manufacturer.NewService(manufacturerRepo, usageClassRepo)
	manufacturerHandler := manufacturer.NewHandler(manufacturerService)

	equipDictRepo := equipmentdictionary.NewRepository(queries)
	equipDictService := equipmentdictionary.NewService(equipDictRepo, metrologicalTypeRepo)
	equipDictHandler := equipmentdictionary.NewHandler(equipDictService)

	// router
	router := chi.NewRouter()

	// Middleware
	// RequestID и RealIP должны идти раньше custom slog middleware, чтобы в
	// structured request logs попадали correlation fields для smoke/debug flows.
	// Стандартный chi.Logger не используем: Stage 02 baseline ожидает JSON-логи.
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Recoverer)
	router.Use(requestLoggingMiddleware(logger))

	// Настройка сервера
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	app := &App{
		server: server,
		router: router,
		db:     database,
		cfg:    cfg,
		logger: logger,
	}

	// Routes
	app.registerRoutes(orgHandler, eqHandler, agreementHandler, manufacturerHandler, equipDictHandler, usageClassHandler, metrologicalTypeHandler)

	return app, nil
}

func (a *App) registerRoutes(
	organizationHandler *organization.OrganizationHandler,
	eqHandler *equipment.EquipmentHandler,
	agreementHandler *agreement.AgreementHandler,
	manufacturerHandler *manufacturer.ManufacturerHandler,
	equipDictHandler *equipmentdictionary.Handler,
	usageClassHandler *usageclassification.Handler,
	metrologicalTypeHandler *metrologicaltype.Handler,
) {
	a.router.Get("/healthz", a.handleHealth)
	a.router.Get("/readyz", a.handleReady)

	a.router.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	a.router.Route("/api/v1", func(r chi.Router) {
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
		//	r.Patch("/{id}", eqHandler.Update)
			r.Delete("/{id}", eqHandler.Delete)
		})

		r.Route("/manufacturers", func(r chi.Router) {
			r.Get("/", manufacturerHandler.List)
			r.Post("/", manufacturerHandler.Create)
			r.Get("/{id}", manufacturerHandler.GetByID)
			r.Patch("/{id}", manufacturerHandler.Update)
			r.Delete("/{id}", manufacturerHandler.Delete)
		})

		r.Route("/equipment-dictionaries", func(r chi.Router) {
			r.Get("/", equipDictHandler.List)
			r.Post("/", equipDictHandler.Create)
			r.Get("/{id}", equipDictHandler.GetByID)
			r.Patch("/{id}", equipDictHandler.Update)
			r.Delete("/{id}", equipDictHandler.Delete)
		})

		r.Route("/usage-classifications", func(r chi.Router) {
			r.Get("/", usageClassHandler.List)
			r.Post("/", usageClassHandler.Create)
			r.Get("/{id}", usageClassHandler.GetByID)
			r.Delete("/{id}", usageClassHandler.Delete)
		})

		r.Route("/metrological-types", func(r chi.Router) {
			r.Get("/", metrologicalTypeHandler.List)
			r.Post("/", metrologicalTypeHandler.Create)
			r.Get("/{id}", metrologicalTypeHandler.GetByID)
			r.Delete("/{id}", metrologicalTypeHandler.Delete)
		})

		// Agreements
		// r.Route("/agreements", func(r chi.Router) {
		// 	r.Get("/", agreementHandler.List)
		// 	r.Post("/", agreementHandler.Create)
		// 	r.Get("/{id}", agreementHandler.GetByID)
		// 	r.Put("/{id}", agreementHandler.Update)
		// 	r.Delete("/{id}", agreementHandler.Delete)
		// })
	})
}

func (a *App) Run(ctx context.Context) error {
	// Run отвечает только за lifecycle ListenAndServe. Graceful shutdown
	// вызывается отдельно, чтобы ctx cancellation не дублировал остановку.
	a.logger.Info(
		"server_starting",
		"address", a.server.Addr,
		"environment", a.cfg.Server.Environment,
	)

	errCh := make(chan error, 1)
	go func() {
		if err := a.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- fmt.Errorf("server error: %w", err)
		}
	}()

	select {
	case <-ctx.Done():
		return nil
	case err := <-errCh:
		return err
	}
}

func (a *App) Shutdown(ctx context.Context) error {
	a.logger.Info("server_stopping")

	// Сначала перестаем принимать новые запросы, потом закрываем shared DB pool.
	if err := a.server.Shutdown(ctx); err != nil {
		return err
	}

	if a.db != nil {
		a.db.Close()
	}

	a.logger.Info("server_stopped")

	return nil
}
