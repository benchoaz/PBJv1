package repository

import (
	"testing"
	"time"

	"pbj/internal/models"
)

func TestProjectRepository_GetAll_Empty(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	filter := &models.ProjectFilter{}
	projects, err := repo.GetAll(filter)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(projects) != 0 {
		t.Errorf("Expected 0 projects, got %d", len(projects))
	}
}

func TestProjectRepository_CreateAndGet(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	now := time.Now()
	input := &models.ProjectCreate{
		Name:        "Test Project",
		Description: "Test Description",
		Budget:      1000000,
		Ministry:    "Test Ministry",
		Province:    "DKI Jakarta",
		SourceURL:   "https://example.com",
		Status:      "baru",
		StartDate:   &now,
	}

	created, err := repo.Create(input)
	if err != nil {
		t.Fatalf("Failed to create project: %v", err)
	}

	if created.ID <= 0 {
		t.Error("Expected project ID to be positive")
	}
	if created.Name != input.Name {
		t.Errorf("Expected name %s, got %s", input.Name, created.Name)
	}
	if created.Budget != input.Budget {
		t.Errorf("Expected budget %f, got %f", input.Budget, created.Budget)
	}

	retrieved, err := repo.GetByID(created.ID)
	if err != nil {
		t.Fatalf("Failed to retrieve project: %v", err)
	}
	if retrieved == nil {
		t.Fatal("Expected project to exist")
	}
	if retrieved.Name != input.Name {
		t.Errorf("Retrieved name mismatch: expected %s, got %s", input.Name, retrieved.Name)
	}
}

func TestProjectRepository_Update(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	input := &models.ProjectCreate{
		Name:     "Original Name",
		Budget:   1000000,
		Ministry: "Test Ministry",
		Province: "DKI Jakarta",
		Status:   "baru",
	}
	created, _ := repo.Create(input)

	newName := "Updated Name"
	update := &models.ProjectUpdate{
		Name: &newName,
	}
	updated, err := repo.Update(created.ID, update)
	if err != nil {
		t.Fatalf("Failed to update project: %v", err)
	}
	if updated.Name != newName {
		t.Errorf("Expected name %s, got %s", newName, updated.Name)
	}
}

func TestProjectRepository_Delete(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	input := &models.ProjectCreate{
		Name:     "To Delete",
		Budget:   1000000,
		Ministry: "Test Ministry",
		Province: "DKI Jakarta",
		Status:   "baru",
	}
	created, _ := repo.Create(input)

	err := repo.Delete(created.ID)
	if err != nil {
		t.Fatalf("Failed to delete project: %v", err)
	}

	retrieved, _ := repo.GetByID(created.ID)
	if retrieved != nil {
		t.Error("Expected project to be deleted")
	}
}

func TestProjectRepository_Filter(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	repo.Create(&models.ProjectCreate{
		Name:     "Project A", Ministry: "Finance", Province: "Jakarta", Budget: 1000000, Status: "baru",
	})
	repo.Create(&models.ProjectCreate{
		Name:     "Project B", Ministry: "Health", Province: "Bandung", Budget: 2000000, Status: "sedang",
	})

	filter := &models.ProjectFilter{Ministry: "Finance"}
	projects, _ := repo.GetAll(filter)
	if len(projects) != 1 {
		t.Errorf("Expected 1 project for Finance, got %d", len(projects))
	}

	filter = &models.ProjectFilter{Status: "sedang"}
	projects, _ = repo.GetAll(filter)
	if len(projects) != 1 {
		t.Errorf("Expected 1 project with 'sedang' status, got %d", len(projects))
	}

	filter = &models.ProjectFilter{MinBudget: 1500000}
	projects, _ = repo.GetAll(filter)
	if len(projects) != 1 {
		t.Errorf("Expected 1 project with budget >= 1500000, got %d", len(projects))
	}
}

func TestProjectRepository_GetByID_NotFound(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	project, err := repo.GetByID(999999)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if project != nil {
		t.Error("Expected nil project for non-existent ID")
	}
}

func TestProjectRepository_Count(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	repo.Create(&models.ProjectCreate{
		Name: "Project 1", Ministry: "Finance", Province: "Jakarta", Budget: 1000000, Status: "baru",
	})
	repo.Create(&models.ProjectCreate{
		Name: "Project 2", Ministry: "Finance", Province: "Jakarta", Budget: 2000000, Status: "baru",
	})

	count, err := repo.Count(&models.ProjectFilter{})
	if err != nil {
		t.Fatalf("Failed to count: %v", err)
	}
	if count != 2 {
		t.Errorf("Expected count 2, got %d", count)
	}

	count, err = repo.Count(&models.ProjectFilter{Ministry: "Finance"})
	if err != nil {
		t.Fatalf("Failed to count with filter: %v", err)
	}
	if count != 2 {
		t.Errorf("Expected count 2 for Finance, got %d", count)
	}
}