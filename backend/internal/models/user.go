package models
import "time"

type User struct {
	ID              int64  `json:"id" gorm:"primaryKey;autoIncrement"`
	Name            string `json:"name"`
	Username        string `json:"username,omitempty"` // Kept for auth compatibility
	NIP             string `json:"nip"`
	Role            string `json:"role"`
	Department      string `json:"department"`
	IdSatker        string `json:"idSatker"`
	PerangkatDaerah string `json:"perangkatDaerah"`
	Password        string `json:"password"` // In a real app this should be hashed, but we keep it plain for this mock system
	Email           string `json:"email,omitempty"`
	CreatedAt       *time.Time `json:"created_at,omitempty" gorm:"autoCreateTime"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty" gorm:"autoUpdateTime"`
}

type UserCreate struct {
	Name            string `json:"name"`
	NIP             string `json:"nip"`
	Role            string `json:"role"`
	Department      string `json:"department"`
	IdSatker        string `json:"idSatker"`
	PerangkatDaerah string `json:"perangkatDaerah"`
	Password        string `json:"password"`
}

type UserUpdate struct {
	Name            *string `json:"name,omitempty"`
	NIP             *string `json:"nip,omitempty"`
	Role            *string `json:"role,omitempty"`
	Department      *string `json:"department,omitempty"`
	IdSatker        *string `json:"idSatker,omitempty"`
	PerangkatDaerah *string `json:"perangkatDaerah,omitempty"`
	Password        *string `json:"password,omitempty"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}