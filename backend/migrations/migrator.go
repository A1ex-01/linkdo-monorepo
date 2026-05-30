package migrations

import (
	"embed"
	"fmt"
	"sort"
	"strings"

	"gorm.io/gorm"
)

//go:embed *.sql
var fs embed.FS

type migration struct {
	version string
	name    string
	sql     string
}

func (m migration) String() string {
	return m.version + "_" + m.name
}

func Run(db *gorm.DB) error {
	// Create migrations table if not exists
	if err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(255) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`).Error; err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get applied migrations
	var applied []string
	if err := db.Raw("SELECT version FROM schema_migrations").Scan(&applied).Error; err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}
	appliedSet := make(map[string]bool)
	for _, v := range applied {
		appliedSet[v] = true
	}

	// Get all migration files
	migs, err := loadMigrations()
	if err != nil {
		return fmt.Errorf("failed to load migrations: %w", err)
	}

	// Apply pending migrations
	for _, m := range migs {
		if appliedSet[m.version] {
			continue
		}
		fmt.Printf("Applying migration: %s\n", m)

		// Split SQL by semicolon and execute each statement
		statements := splitStatements(m.sql)
		for i, stmt := range statements {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}
			if len(statements) > 1 {
				fmt.Printf("  executing statement %d/%d\n", i+1, len(statements))
			}
			if err := db.Exec(stmt).Error; err != nil {
				// Check if error is "duplicate column" or "unknown column" - these are safe to ignore
				if !isSafeToIgnore(err) {
					return fmt.Errorf("failed to apply migration %s (stmt %d): %w", m, i+1, err)
				}
				fmt.Printf("  (ignored: %v)\n", err)
			}
		}

		if err := db.Exec("INSERT INTO schema_migrations (version, name) VALUES (?, ?)", m.version, m.name).Error; err != nil {
			return fmt.Errorf("failed to record migration %s: %w", m, err)
		}
		fmt.Printf("  applied\n")
	}

	return nil
}

func loadMigrations() ([]migration, error) {
	entries, err := fs.ReadDir(".")
	if err != nil {
		return nil, err
	}

	var migs []migration
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		parts := strings.Split(entry.Name(), "_")
		if len(parts) < 2 {
			continue
		}
		version := parts[0]
		name := strings.TrimSuffix(strings.Join(parts[1:], "_"), ".sql")

		content, err := fs.ReadFile(entry.Name())
		if err != nil {
			return nil, err
		}

		migs = append(migs, migration{
			version: version,
			name:    name,
			sql:     string(content),
		})
	}

	sort.Slice(migs, func(i, j int) bool {
		return migs[i].version < migs[j].version
	})

	return migs, nil
}

func splitStatements(sql string) []string {
	var statements []string
	var current strings.Builder
	inComment := false

	for i := 0; i < len(sql); i++ {
		c := sql[i]

		// Handle single-line comments
		if i+1 < len(sql) && sql[i] == '-' && sql[i+1] == '-' {
			// Skip until end of line
			for i < len(sql) && sql[i] != '\n' {
				i++
			}
			continue
		}

		// Handle multi-line comments
		if i+1 < len(sql) && sql[i] == '/' && sql[i+1] == '*' {
			inComment = true
			i++
			continue
		}
		if i+1 < len(sql) && sql[i] == '*' && sql[i+1] == '/' {
			inComment = false
			i++
			continue
		}
		if inComment {
			continue
		}

		current.WriteByte(c)

		// Split on semicolon
		if c == ';' {
			stmt := strings.TrimSpace(current.String())
			if stmt != "" {
				statements = append(statements, stmt)
			}
			current.Reset()
		}
	}

	// Add remaining content (without trailing semicolon)
	remaining := strings.TrimSpace(current.String())
	if remaining != "" {
		statements = append(statements, remaining)
	}

	return statements
}

func isSafeToIgnore(err error) bool {
	errStr := err.Error()
	safeErrors := []string{
		"Duplicate column name",
		"Unknown column",
		"Table 'collections' already exists",
		"Duplicate key name",
	}
	for _, safe := range safeErrors {
		if strings.Contains(errStr, safe) {
			return true
		}
	}
	return false
}
