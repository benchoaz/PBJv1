package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"pbj/internal/models"
)

type ProjectRepository struct {
	db   *sql.DB
	gorm *gorm.DB
}

func NewProjectRepository(db *sql.DB, gormDB *gorm.DB) *ProjectRepository {
	return &ProjectRepository{db: db, gorm: gormDB}
}

func (r *ProjectRepository) GetAll(filter *models.ProjectFilter) ([]*models.Project, error) {
	query := `SELECT id, name, COALESCE(description, '') as description, budget, ministry, province, id_satker, COALESCE(source_url, '') as source_url, status,
	          COALESCE(start_date::text, '') as start_date,
	          COALESCE(end_date::text, '') as end_date,
	          created_at, updated_at
	          FROM projects WHERE 1=1`
	args := []interface{}{}
	argPos := 1

	if filter.Ministry != "" {
		query += fmt.Sprintf(" AND ministry ILIKE $%d", argPos)
		args = append(args, "%"+filter.Ministry+"%")
		argPos++
	}
	if filter.Province != "" {
		query += fmt.Sprintf(" AND province ILIKE $%d", argPos)
		args = append(args, "%"+filter.Province+"%")
		argPos++
	}
	if filter.IdSatker != "" {
		parts := strings.Split(filter.IdSatker, ",")
		var placeholders []string
		for _, part := range parts {
			placeholders = append(placeholders, fmt.Sprintf("$%d", argPos))
			args = append(args, strings.TrimSpace(part))
			argPos++
		}
		query += fmt.Sprintf(" AND id_satker IN (%s)", strings.Join(placeholders, ", "))
	}
	if filter.Status != "" {
		query += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, filter.Status)
		argPos++
	}
	if filter.MinBudget > 0 {
		query += fmt.Sprintf(" AND budget >= $%d", argPos)
		args = append(args, filter.MinBudget)
		argPos++
	}
	if filter.MaxBudget > 0 {
		query += fmt.Sprintf(" AND budget <= $%d", argPos)
		args = append(args, filter.MaxBudget)
		argPos++
	}

	query += " ORDER BY created_at DESC"

	limit := 20
	offset := 0
	if filter.Limit > 0 {
		limit = filter.Limit
	}
	if filter.Offset > 0 {
		offset = filter.Offset
	}
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("querying projects: %w", err)
	}
	defer rows.Close()

	var projects []*models.Project
	for rows.Next() {
		p := &models.Project{}
		var startDate, endDate string
		err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Budget, &p.Ministry,
			&p.Province, &p.IdSatker, &p.SourceURL, &p.Status, &startDate, &endDate,
			&p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("scanning project row: %w", err)
		}
		p.StartDate = parseTimePtr(startDate)
		p.EndDate = parseTimePtr(endDate)
		projects = append(projects, p)
	}

	if len(projects) > 0 {
		var projectIDs []int64
		for _, p := range projects {
			projectIDs = append(projectIDs, p.ID)
		}

		var allItems []models.ProjectItem
		r.gorm.Preload("Surveys").Where("project_id IN ?", projectIDs).Find(&allItems)

		itemsByProject := make(map[int64][]models.ProjectItem)
		for _, item := range allItems {
			itemsByProject[item.ProjectID] = append(itemsByProject[item.ProjectID], item)
		}

		for _, p := range projects {
			if items, ok := itemsByProject[p.ID]; ok {
				p.Items = items
			} else {
				p.Items = []models.ProjectItem{}
			}
		}
	}

	return projects, rows.Err()
}

func (r *ProjectRepository) GetByID(id int64) (*models.Project, error) {
	query := `SELECT id, name, description, budget, ministry, province, id_satker, source_url, status,
	          COALESCE(start_date::text, '') as start_date,
	          COALESCE(end_date::text, '') as end_date,
	          created_at, updated_at
	          FROM projects WHERE id = $1`

	p := &models.Project{}
	var startDate, endDate string
	err := r.db.QueryRow(query, id).Scan(&p.ID, &p.Name, &p.Description, &p.Budget,
		&p.Ministry, &p.Province, &p.IdSatker, &p.SourceURL, &p.Status, &startDate, &endDate,
		&p.CreatedAt, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("querying project by id: %w", err)
	}
	p.StartDate = parseTimePtr(startDate)
	p.EndDate = parseTimePtr(endDate)

	var allItems []models.ProjectItem
	r.gorm.Preload("Surveys").Where("project_id = ?", id).Find(&allItems)
	p.Items = allItems

	return p, nil
}

func (r *ProjectRepository) Create(input *models.ProjectCreate) (*models.Project, error) {
	status := input.Status
	if status == "" {
		status = "baru"
	}

	var itemsRaw interface{}
	var hasItems bool
	if input.Description != "" {
		var parsed map[string]interface{}
		if err := json.Unmarshal([]byte(input.Description), &parsed); err == nil {
			if raw, ok := parsed["items"]; ok {
				itemsRaw = raw
				hasItems = true
				delete(parsed, "items")
				newDescBytes, _ := json.Marshal(parsed)
				input.Description = string(newDescBytes)
			}
		}
	}

	query := `INSERT INTO projects (name, description, budget, ministry, province, id_satker, source_url, status, start_date, end_date, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
	          RETURNING id, created_at, updated_at`

	var id int64
	var createdAt, updatedAt string
	err := r.db.QueryRow(query, input.Name, input.Description, input.Budget,
		input.Ministry, input.Province, input.IdSatker, input.SourceURL, status,
		input.StartDate, input.EndDate).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("inserting project: %w", err)
	}

	if hasItems {
		itemsBytes, _ := json.Marshal(itemsRaw)
		var items []models.ProjectItem
		if err := json.Unmarshal(itemsBytes, &items); err == nil {
			for i := range items {
				items[i].ProjectID = id
			}
			if len(items) > 0 {
				r.gorm.Create(&items)
			}
		}
	}

	return r.GetByID(id)
}

func (r *ProjectRepository) Update(id int64, input *models.ProjectUpdate) (*models.Project, error) {
	setClauses := []string{}
	args := []interface{}{}
	argPos := 1

	if input.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argPos))
		args = append(args, *input.Name)
		argPos++
	}
	if input.Description != nil {
		var parsed map[string]interface{}
		if err := json.Unmarshal([]byte(*input.Description), &parsed); err == nil {
			if itemsRaw, ok := parsed["items"]; ok {
				// extract items, delete from parsed
				delete(parsed, "items")
				newDescBytes, _ := json.Marshal(parsed)
				newDescStr := string(newDescBytes)
				input.Description = &newDescStr

				// Delete old items
				r.gorm.Where("project_id = ?", id).Delete(&models.ProjectItem{})
				
				itemsBytes, _ := json.Marshal(itemsRaw)
				var items []models.ProjectItem
				if err := json.Unmarshal(itemsBytes, &items); err == nil {
					for i := range items {
						items[i].ProjectID = id
					}
					if len(items) > 0 {
						r.gorm.Create(&items)
					}
				}
			}
		}

		setClauses = append(setClauses, fmt.Sprintf("description = $%d", argPos))
		args = append(args, *input.Description)
		argPos++
	}
	if input.Budget != nil {
		setClauses = append(setClauses, fmt.Sprintf("budget = $%d", argPos))
		args = append(args, *input.Budget)
		argPos++
	}
	if input.Ministry != nil {
		setClauses = append(setClauses, fmt.Sprintf("ministry = $%d", argPos))
		args = append(args, *input.Ministry)
		argPos++
	}
	if input.Province != nil {
		setClauses = append(setClauses, fmt.Sprintf("province = $%d", argPos))
		args = append(args, *input.Province)
		argPos++
	}
	if input.IdSatker != nil {
		setClauses = append(setClauses, fmt.Sprintf("id_satker = $%d", argPos))
		args = append(args, *input.IdSatker)
		argPos++
	}
	if input.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argPos))
		args = append(args, *input.Status)
		argPos++
	}

	if len(setClauses) == 0 {
		return r.GetByID(id)
	}

	setClauses = append(setClauses, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE projects SET %s WHERE id = $%d", strings.Join(setClauses, ", "), argPos)
	args = append(args, id)

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("updating project: %w", err)
	}

	return r.GetByID(id)
}

func (r *ProjectRepository) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM projects WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("deleting project: %w", err)
	}
	return nil
}

func (r *ProjectRepository) Count(filter *models.ProjectFilter) (int, error) {
	query := "SELECT COUNT(*) FROM projects WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if filter.Ministry != "" {
		query += fmt.Sprintf(" AND ministry ILIKE $%d", argPos)
		args = append(args, "%"+filter.Ministry+"%")
		argPos++
	}
	if filter.Province != "" {
		query += fmt.Sprintf(" AND province ILIKE $%d", argPos)
		args = append(args, "%"+filter.Province+"%")
		argPos++
	}
	if filter.IdSatker != "" {
		parts := strings.Split(filter.IdSatker, ",")
		var placeholders []string
		for _, part := range parts {
			placeholders = append(placeholders, fmt.Sprintf("$%d", argPos))
			args = append(args, strings.TrimSpace(part))
			argPos++
		}
		query += fmt.Sprintf(" AND id_satker IN (%s)", strings.Join(placeholders, ", "))
	}
	if filter.Status != "" {
		query += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, filter.Status)
		argPos++
	}

	var count int
	err := r.db.QueryRow(query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("counting projects: %w", err)
	}
	return count, nil
}