package models

import "time"

// RakDocument represents an uploaded RKA (Rencana Kerja dan Anggaran) file
type RakDocument struct {
	ID             uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	SatkerID       string     `gorm:"index;not null" json:"satker_id"`
	TahunAnggaran  int        `gorm:"not null" json:"tahun_anggaran"`
	NamaSkpd       string     `json:"nama_skpd"`
	NilaiAnggaran  float64    `gorm:"type:decimal(18,2);default:0" json:"nilai_anggaran"`
	FileURL        string     `json:"file_url"`
	FileName       string     `json:"file_name"`
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	UploadedBy     *uint64    `json:"uploaded_by,omitempty"`
	UploadedAt     time.Time  `gorm:"default:now()" json:"uploaded_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	// Relations
	Accounts []BudgetAccount `gorm:"foreignKey:RakDocumentID;constraint:OnDelete:CASCADE;" json:"accounts,omitempty"`
}

// BudgetAccount represents one row in RKA (one kode rekening with monthly allocation)
type BudgetAccount struct {
	ID              uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	RakDocumentID   uint64     `gorm:"index;not null" json:"rak_document_id"`
	SatkerID        string     `gorm:"uniqueIndex:idx_budget_satker_kode;not null" json:"satker_id"`
	TahunAnggaran   int        `gorm:"uniqueIndex:idx_budget_satker_kode;not null" json:"tahun_anggaran"`
	KodeRekening    string     `gorm:"uniqueIndex:idx_budget_satker_kode;not null" json:"kode_rekening"`
	Uraian          string     `json:"uraian"`
	LevelRekening   int        `json:"level_rekening"` // 1=Kelompok, 2=Jenis, 3=Obyek, 4=Rincian
	Program         string     `json:"program"`
	Kegiatan        string     `json:"kegiatan"`
	SubKegiatan     string     `gorm:"uniqueIndex:idx_budget_satker_kode;not null;default:''" json:"sub_kegiatan"`

	// Annual budget
	AnggaranTahun   float64    `gorm:"type:decimal(18,2);default:0" json:"anggaran_tahun"`
	TotalRak        float64    `gorm:"type:decimal(18,2);default:0" json:"total_rak"`

	// Monthly allocation (Semester I - Triwulan I)
	BulanJan        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_jan"`
	BulanFeb        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_feb"`
	BulanMar        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_mar"`

	// Monthly allocation (Semester I - Triwulan II)
	BulanApr        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_apr"`
	BulanMei        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_mei"`
	BulanJun        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_jun"`

	// Monthly allocation (Semester II - Triwulan III)
	BulanJul        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_jul"`
	BulanAgs        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_ags"`
	BulanSep        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_sep"`

	// Monthly allocation (Semester II - Triwulan IV)
	BulanOkt        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_okt"`
	BulanNov        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_nov"`
	BulanDes        float64    `gorm:"type:decimal(18,2);default:0" json:"bulan_des"`

	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	// Relations (no FK constraints to avoid circular)
	DpaAccount    *DpaAccountSaved  `gorm:"foreignKey:BudgetAccountID" json:"dpa_account,omitempty"`
	Realization   []BudgetRealization `gorm:"foreignKey:BudgetAccountID;constraint:OnDelete:CASCADE;" json:"realization,omitempty"`
}

// DpaAccountSaved represents a saved DPA account record (parsed from DPA PDF)
type DpaAccountSaved struct {
	ID                uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	SatkerID          string     `gorm:"uniqueIndex:idx_dpa_satker_kode;not null" json:"satker_id"`
	TahunAnggaran     int        `gorm:"uniqueIndex:idx_dpa_satker_kode;not null" json:"tahun_anggaran"`
	KodeRekening      string     `gorm:"uniqueIndex:idx_dpa_satker_kode;not null" json:"kode_rekening"`
	UraianRekening    string     `json:"uraian_rekening"`
	PaguDpa           float64    `gorm:"type:decimal(18,2);default:0" json:"pagu_dpa"`

	// Link to RKA (auto-matched by kode_rekening)
	BudgetAccountID   *uint64    `gorm:"index" json:"budget_account_id,omitempty"`
	IsRakLinked       bool       `gorm:"default:false" json:"is_rak_linked"`
	RakPaguDiff       float64    `gorm:"type:decimal(18,2);default:0" json:"rak_pagu_diff"`

	// Parsing metadata
	Confidence        int        `gorm:"default:0" json:"confidence"`
	OcrEngine         string     `gorm:"default:''" json:"ocr_engine"`
	PaguMethod        string     `gorm:"default:''" json:"pagu_method"`
	IsVerified        bool       `gorm:"default:false" json:"is_verified"`
	IsValid           bool       `gorm:"default:true" json:"is_valid"`
	ValidationReason  string     `json:"validation_reason"`
	RawTextBlock      string     `gorm:"type:text" json:"raw_text_block,omitempty"`

	// Source file
	FileURL           string     `json:"file_url"`
	FileName          string     `json:"file_name"`

	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`

	// Relations
	Items         []DpaItemSaved    `gorm:"foreignKey:DpaAccountID;constraint:OnDelete:CASCADE;" json:"items,omitempty"`
	SirupPackages []SirupPackageSaved `gorm:"foreignKey:DpaAccountID" json:"sirup_packages,omitempty"`
}

// DpaItemSaved represents a line item within a DpaAccount
type DpaItemSaved struct {
	ID            uint64  `gorm:"primaryKey;autoIncrement" json:"id"`
	DpaAccountID  uint64  `gorm:"index;not null" json:"dpa_account_id"`
	NoUrut        int     `gorm:"default:1" json:"no_urut"`
	NamaBarang    string  `gorm:"not null" json:"nama_barang"`
	Spesifikasi   string  `json:"spesifikasi"`
	Volume        float64 `gorm:"type:decimal(12,4);default:1" json:"volume"`
	Satuan        string  `gorm:"default:'Buah'" json:"satuan"`
	HargaSatuan   float64 `gorm:"type:decimal(18,2);default:0" json:"harga_satuan"`
	HargaTotal    float64 `gorm:"type:decimal(18,2);default:0" json:"harga_total"`
	CreatedAt     time.Time `json:"created_at"`
}

// SirupPackageSaved represents a saved SIRUP (RUP) package linked to a DpaAccount
type SirupPackageSaved struct {
	ID               uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	SatkerID         string     `gorm:"index;not null" json:"satker_id"`
	TahunAnggaran    int        `gorm:"not null" json:"tahun_anggaran"`

	// SIRUP data
	NoSirup          string     `gorm:"uniqueIndex:idx_sirup_no_tahun;not null" json:"no_sirup"`
	NamaPaket        string     `gorm:"not null" json:"nama_paket"`
	PaguSirup        float64    `gorm:"type:decimal(18,2);default:0" json:"pagu_sirup"`
	SumberDana       string     `json:"sumber_dana"`
	MetodePemilihan  string     `json:"metode_pemilihan"`
	JenisPengadaan   string     `json:"jenis_pengadaan"`
	Mak              string     `gorm:"index" json:"mak"` // kode rekening / MAK
	Klpd             string     `json:"klpd"`
	SatkerNama       string     `json:"satker_nama"`
	VolumePekerjaan  string     `json:"volume_pekerjaan"`
	Lokasi           string     `json:"lokasi"`
	Uraian           string     `gorm:"type:text" json:"uraian"`
	Spesifikasi      string     `gorm:"type:text" json:"spesifikasi"`
	StatusSirup      string     `json:"status_sirup"`

	// Link to DPA (auto-matched by kode_rekening / MAK)
	DpaAccountID     *uint64    `gorm:"index" json:"dpa_account_id,omitempty"`
	IsDpaLinked      bool       `gorm:"default:false" json:"is_dpa_linked"`
	PaguDiff         float64    `gorm:"type:decimal(18,2);default:0" json:"pagu_diff"`

	// Metadata
	RawJson          string     `gorm:"type:jsonb" json:"raw_json,omitempty"`
	SourceURL        string     `json:"source_url"`
	ScrapedAt        time.Time  `json:"scraped_at"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// BudgetRealization records monthly realization per budget account
type BudgetRealization struct {
	ID              uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	BudgetAccountID uint64    `gorm:"uniqueIndex:idx_real_account_bulan;not null;index" json:"budget_account_id"`
	SatkerID        string    `gorm:"index;not null" json:"satker_id"`
	TahunAnggaran   int       `gorm:"uniqueIndex:idx_real_account_bulan;not null" json:"tahun_anggaran"`
	Bulan           int       `gorm:"uniqueIndex:idx_real_account_bulan;not null;check:bulan >= 1 AND bulan <= 12" json:"bulan"`
	NilaiRealisasi  float64   `gorm:"type:decimal(18,2);default:0" json:"nilai_realisasi"`
	Keterangan      string    `json:"keterangan"`
	CreatedBy       *uint64   `json:"created_by,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// --- Request/Response helpers ---

type SaveDpaAccountsRequest struct {
	SatkerID      string             `json:"satker_id"`
	TahunAnggaran int                `json:"tahun_anggaran"`
	FileName      string             `json:"file_name"`
	Accounts      []DpaAccountInput  `json:"accounts"`
}

type DpaAccountInput struct {
	KodeRekening     string          `json:"account"`
	UraianRekening   string          `json:"name"`
	PaguDpa          float64         `json:"pagu"`
	Confidence       int             `json:"confidence"`
	OcrEngine        string          `json:"ocr_engine"`
	PaguMethod       string          `json:"pagu_method"`
	IsVerified       bool            `json:"verified"`
	IsValid          *bool           `json:"is_valid"`
	ValidationReason string          `json:"validation_reason"`
	RawTextBlock     string          `json:"raw_text_block"`
	Items            []DpaItemInput  `json:"items"`
}

type DpaItemInput struct {
	NoUrut      int     `json:"no"`
	NamaBarang  string  `json:"nama"`
	Volume      float64 `json:"volume"`
	Satuan      string  `json:"satuan"`
	HargaSatuan float64 `json:"harga_satuan"`
	HargaTotal  float64 `json:"harga_total"`
}

type SaveSirupPackageRequest struct {
	SatkerID      string               `json:"satker_id"`
	TahunAnggaran int                  `json:"tahun_anggaran"`
	Packages      []SirupPackageInput  `json:"packages"`
}

type SirupPackageInput struct {
	NoSirup         string  `json:"noSirup"`
	NamaPaket       string  `json:"packName"`
	PaguSirup       float64 `json:"pagu"`
	SumberDana      string  `json:"sumberDana"`
	MetodePemilihan string  `json:"method"`
	JenisPengadaan  string  `json:"jenisPengadaan"`
	Mak             string  `json:"mak"`
	Klpd            string  `json:"klpd"`
	SatkerNama      string  `json:"satker"`
	VolumePekerjaan string  `json:"volume"`
	Lokasi          string  `json:"lokasi"`
	Uraian          string  `json:"uraian"`
	Spesifikasi     string  `json:"spesifikasi"`
	StatusSirup     string  `json:"statusSirup"`
	SourceURL       string  `json:"sourceUrl"`
}
