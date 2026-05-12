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
	"backend/internal/auth/bootstrap"
	"backend/internal/auth/organization"
	"backend/internal/db/generated"
	"backend/internal/equipment/equipment"
	"backend/internal/equipment/measuringinstrument"
	"backend/internal/equipment/metrologyjournal"
	"backend/internal/equipment/photo"
	"backend/internal/equipment/standard"
	"backend/internal/infrastructure/config"
	"backend/internal/infrastructure/db"
	"backend/internal/infrastructure/objectstorage"
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
	// Organization
	orgRepo := organization.NewRepository(queries)
	orgService := organization.NewService(orgRepo)
	orgHandler := organization.NewHandler(orgService)

	bootstrapRepo := bootstrap.NewRepository(database, queries)
	objectStorage, err := objectstorage.New(ctx, cfg.ObjectStorage)
	if err != nil {
		return nil, err
	}
	bootstrapService := bootstrap.NewService(bootstrapRepo, queries, objectStorage)
	bootstrapHandler := bootstrap.NewHandler(bootstrapService)

	photoRepo := photo.NewRepository(database)
	photoService := photo.NewService(photoRepo, bootstrapService, objectStorage)
	photoHandler := photo.NewHandler(photoService)

	journalRepo := metrologyjournal.NewRepository(database)

	// Equipment
	eqRepo := equipment.NewRepository(database)
	eqService := equipment.NewService(eqRepo, journalRepo, bootstrapService, photoRepo)
	eqHandler := equipment.NewHandler(eqService)

	// Standard
	stdRepo := standard.NewRepository(database)
	stdService := standard.NewService(stdRepo, journalRepo, bootstrapService)
	stdHandler := standard.NewHandler(stdService)

	// Measuring Instrument
	miRepo := measuringinstrument.NewRepository(database)
	miService := measuringinstrument.NewService(miRepo, journalRepo, bootstrapService, photoRepo)
	miHandler := measuringinstrument.NewHandler(miService)

	agreementRepo := agreement.NewRepository(queries)
	agreementService := agreement.NewService(agreementRepo, bootstrapService)
	agreementHandler := agreement.NewHandler(agreementService)

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
	app.registerRoutes(orgHandler, bootstrapHandler, eqHandler, stdHandler, miHandler, photoHandler, agreementHandler)

	return app, nil
}

func (a *App) registerRoutes(
	organizationHandler *organization.OrganizationHandler,
	bootstrapHandler *bootstrap.Handler,
	eqHandler *equipment.EquipmentHandler,
	stdHandler *standard.StandardHandler,
	miHandler *measuringinstrument.MeasuringInstrumentHandler,
	photoHandler *photo.Handler,
	agreementHandler *agreement.AgreementHandler,
) {
	// Health/readiness вынесены из `/api/v1`, чтобы compose, CI и внешние
	// health probes могли проверять процесс и БД без зависимости от business API.
	a.router.Get("/healthz", a.handleHealth)
	a.router.Get("/readyz", a.handleReady)

	a.router.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	a.router.Route("/api/v1", func(r chi.Router) {
		// Organizations
		r.With(platformAdminMiddleware(a.cfg.PlatformAdmin.SharedSecret)).Route("/organizations", func(r chi.Router) {
			r.Get("/", organizationHandler.List)
			r.Post("/", organizationHandler.Create)
			r.Get("/{id}", organizationHandler.GetByID)
			r.Patch("/{id}", organizationHandler.Update)
			r.Delete("/{id}", organizationHandler.Delete)
		})

		r.With(platformAdminMiddleware(a.cfg.PlatformAdmin.SharedSecret)).Route("/platform", func(r chi.Router) {
			r.Post("/organization-shells", bootstrapHandler.CreateOrganizationShell)
		})

		r.Route("/first-admin-invites", func(r chi.Router) {
			r.Get("/{token}", bootstrapHandler.InspectInvite)
			r.Post("/{token}/accept", bootstrapHandler.AcceptInvite)
		})

		r.Route("/invites", func(r chi.Router) {
			r.Get("/{token}", bootstrapHandler.InspectPublicInvite)
			r.Post("/{token}/accept", bootstrapHandler.AcceptPublicInvite)
		})

		r.Route("/employee-invites", func(r chi.Router) {
			r.Get("/", bootstrapHandler.ListEmployeeInvites)
			r.Post("/", bootstrapHandler.CreateEmployeeInvite)
			r.Post("/{inviteID}/send", bootstrapHandler.SendEmployeeInvite)
			r.Post("/{inviteID}/revoke", bootstrapHandler.RevokeEmployeeInvite)
		})

		r.Route("/employees", func(r chi.Router) {
			r.Get("/", bootstrapHandler.ListEmployees)
			r.Patch("/{accessID}", bootstrapHandler.UpdateEmployeeAccess)
			r.Post("/{accessID}/deactivate", bootstrapHandler.DeactivateEmployee)
		})

		r.Route("/company", func(r chi.Router) {
			r.Patch("/profile", bootstrapHandler.UpdateCompanyProfile)
			r.Get("/logo", bootstrapHandler.GetCompanyLogo)
			r.Post("/logo", bootstrapHandler.UploadCompanyLogo)
			r.Delete("/logo", bootstrapHandler.DeleteCompanyLogo)
			r.Post("/divisions", bootstrapHandler.CreateDivision)
			r.Patch("/divisions/{divisionID}", bootstrapHandler.UpdateDivision)
			r.Post("/divisions/{divisionID}/archive", bootstrapHandler.ArchiveDivision)
			r.Post("/units", bootstrapHandler.CreateUnit)
			r.Patch("/units/{unitID}", bootstrapHandler.UpdateUnit)
			r.Post("/units/{unitID}/archive", bootstrapHandler.ArchiveUnit)
		})

		r.Route("/sessions", func(r chi.Router) {
			r.Post("/", bootstrapHandler.CreateSession)
			r.Get("/current", bootstrapHandler.CurrentSession)
			r.Delete("/current", bootstrapHandler.DeleteCurrentSession)
		})

		r.Post("/launch-wizard", bootstrapHandler.CompleteLaunchWizard)

		// Equipment
		r.Route("/equipment", func(r chi.Router) {
			r.Get("/", eqHandler.List)
			r.Post("/", eqHandler.Create)
			r.Get("/{id}", eqHandler.GetByID)
			r.Patch("/{id}", eqHandler.Update)
			r.Post("/{id}/archive", eqHandler.Archive)
			r.Get("/{id}/journals", eqHandler.ListJournals)
			r.Post("/{id}/journals", eqHandler.CreateJournal)
			r.Post("/{id}/photos", photoHandler.UploadTechnicalPhoto)
			r.Get("/{id}/photos/{photoId}", photoHandler.GetTechnicalPhoto)
			r.Delete("/{id}/photos/{photoId}", photoHandler.DeleteTechnicalPhoto)
		})

		// Measuring Instruments
		r.Route("/measuring-instruments", func(r chi.Router) {
			r.Get("/", miHandler.List)
			r.Post("/", miHandler.Create)
			r.Get("/{id}", miHandler.GetByID)
			r.Patch("/{id}", miHandler.Update)
			r.Post("/{id}/standards", stdHandler.CreateForDiagnostic)
			r.Delete("/{id}/standards/{standardId}", stdHandler.DeleteFromDiagnostic)
			r.Post("/{id}/photos", photoHandler.UploadDiagnosticPhoto)
			r.Get("/{id}/photos/{photoId}", photoHandler.GetDiagnosticPhoto)
			r.Delete("/{id}/photos/{photoId}", photoHandler.DeleteDiagnosticPhoto)
			r.Get("/{id}/journals", miHandler.ListJournals)
			r.Post("/{id}/journals", miHandler.CreateJournal)
			r.Post("/{id}/archive", miHandler.Archive)
		})

		// Agreements
		r.Route("/agreements", func(r chi.Router) {
			r.Get("/", agreementHandler.List)
			r.Post("/", agreementHandler.Create)
			r.Get("/contractors", agreementHandler.ListActiveContractors)
			r.Post("/routing/resolve", agreementHandler.ResolveRouting)
			r.Get("/{id}", agreementHandler.GetByID)
			r.Put("/{id}", agreementHandler.Update)
		})
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
