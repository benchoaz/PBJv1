package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"pbj/internal/models"
	"gorm.io/gorm"
)

var satkerMap = map[string]string{
	"308386": "Unit Kerja Pengadaan Barang/Jasa (UKPBJ)",
	"67081":  "Kecamatan Besuk",
	"67082":  "Kecamatan Kraksaan",
	"67083":  "Kecamatan Dringu",
	"67084":  "Kecamatan Paiton",
	"67085":  "Kecamatan Gending",
	"67086":  "Kecamatan Banyuanyar",
	"67087":  "Kecamatan Maron",
	"67088":  "Kecamatan Leces",
	"67089":  "Kecamatan Tongas",
	"67090":  "Kecamatan Sumberasih",
	"67091":  "Kecamatan Wonomerto",
	"67092":  "Kecamatan Kuripan",
	"67093":  "Kecamatan Bantaran",
	"67094":  "Kecamatan Sukapura",
	"67095":  "Kecamatan Sumber",
	"67096":  "Kecamatan Tegalsiwalan",
	"67097":  "Kecamatan Gading",
	"67098":  "Kecamatan Pakuniran",
	"67099":  "Kecamatan Kotaanyar",
	"67100":  "Kecamatan Pajarakan",
	"67101":  "Kecamatan Tiris",
	"67102":  "Kecamatan Krucil",
	"67001":  "Dinas Kesehatan",
	"67002":  "Dinas Pekerjaan Umum & Penataan Ruang (PUPR)",
	"67003":  "Dinas Pendidikan dan Kebudayaan",
	"67004":  "Dinas Lingkungan Hidup (DLH)",
	"67005":  "RSUD Waluyo Jati Kraksaan (BLU)",
	"67006":  "Dinas Koperasi, Usaha Mikro, Perdagangan dan Perindustrian",
	"67007":  "Badan Perencanaan Pembangunan, Penelitian dan Pengembangan Daerah (Bapelitbangda)",
	"67008":  "Badan Pengelolaan Keuangan dan Pendapatan Daerah (BPKPD)",
	"67009":  "Dinas Perhubungan",
	"67010":  "Dinas Pertanian dan Ketahanan Pangan",
	"67011":  "Dinas Sosial",
	"67012":  "Dinas Pemberdayaan Masyarakat dan Desa (DPMD)",
	"67013":  "Satuan Polisi Pamong Praja (Satpol PP)",
	"67014":  "Dinas Pariwisata dan Kebudayaan",
	"67015":  "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP)",
	"67016":  "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM)",
	"67017":  "Dinas Komunikasi, Informatika, Statistik dan Persandian",
	"67018":  "Dinas Perpustakaan dan Kearsipan",
	"67019":  "Dinas Ketahanan Pangan",
	"67020":  "Dinas Perikanan",
	"67021":  "Dinas Perindustrian dan Perdagangan",
	"67022":  "Badan Penanggulangan Bencana Daerah (BPBD)",
	"67023":  "Badan Kesatuan Bangsa dan Politik (Bakesbangpol)",
	"67024":  "RSUD Tongas",
	"67025":  "Sekretariat Daerah",
	"67026":  "Sekretariat DPRD",
	"67027":  "Inspektorat Daerah",
}

type VendorReview struct {
	ProjectID           int64     `json:"project_id"`
	ProjectName         string    `json:"project_name"`
	PPName              string    `json:"pp_name"`
	Rating              float64   `json:"rating"`
	QualityRating       int       `json:"quality_rating"`
	DeliveryRating      int       `json:"delivery_rating"`
	CommunicationRating int       `json:"communication_rating"`
	Status              string    `json:"status"`
	Note                string    `json:"note"`
	Date                time.Time `json:"date"`
}

type VendorPerformanceItem struct {
	VendorName       string         `json:"vendor_name"`
	AverageRating    float64        `json:"average_rating"`
	AverageQuality   float64        `json:"average_quality"`
	AverageDelivery  float64        `json:"average_delivery"`
	AverageComm      float64        `json:"average_comm"`
	TotalPackages    int            `json:"total_packages"`
	Status           string         `json:"status"`
	ServedSatkers    []string       `json:"served_satkers"`
	Reviews          []VendorReview `json:"reviews"`
}

type VendorReportHandler struct {
	DB *gorm.DB
}

func NewVendorReportHandler(db *gorm.DB) *VendorReportHandler {
	return &VendorReportHandler{DB: db}
}

// GET /api/reports/vendor-performance
func (h *VendorReportHandler) GetVendorPerformance(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-Role, X-User-Satker")

	var projects []models.Project
	// Scan finished projects
	err := h.DB.Preload("Items").Where("status = ? OR status = ?", "Selesai", "Selesai (Arsip Lengkap)").Find(&projects).Error
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch projects: "+err.Error())
		return
	}

	vendorMap := make(map[string]*VendorPerformanceItem)

	for _, p := range projects {
		if p.Description == "" {
			continue
		}

		// Parse description
		var descData struct {
			SelectedPack struct {
				PackName string `json:"packName"`
			} `json:"selectedPack"`
			PPEvaluation struct {
				VendorRating        string `json:"vendorRating"`
				VendorRatingStatus  string `json:"vendorRatingStatus"`
				VendorRatingNote    string `json:"vendorRatingNote"`
				QualityRating       string `json:"qualityRating"`
				DeliveryRating      string `json:"deliveryRating"`
				CommunicationRating string `json:"communicationRating"`
			} `json:"ppEvaluation"`
		}

		if err := json.Unmarshal([]byte(p.Description), &descData); err != nil {
			continue
		}

		// Extract vendor name from the project items first, as it contains the negotiated vendor name
		vendorName := ""
		if len(p.Items) > 0 {
			for _, item := range p.Items {
				if item.Vendor != "" {
					vendorName = item.Vendor
					break
				}
			}
		}

		// Fetch the associated BAHP as fallback to get the vendor name
		var bahp models.BahpDocument
		if vendorName == "" {
			h.DB.Where("project_id = ?", p.ID).Order("id DESC").First(&bahp)
			vendorName = bahp.VendorName
		} else {
			// Still fetch BAHP for PPName / other fields if needed
			h.DB.Where("project_id = ?", p.ID).Order("id DESC").First(&bahp)
		}

		if vendorName == "" {
			vendorName = "Penyedia e-Katalog"
		}

		// Normalize vendor name
		vendorName = strings.TrimSpace(strings.ToUpper(vendorName))

		// Parse overall rating
		ratingVal := 0.0
		if descData.PPEvaluation.VendorRating != "" {
			if f, err := strconv.ParseFloat(descData.PPEvaluation.VendorRating, 64); err == nil {
				ratingVal = f
			}
		}

		// Parse sub ratings
		qRating := 0
		dRating := 0
		cRating := 0
		if descData.PPEvaluation.QualityRating != "" {
			qRating, _ = strconv.Atoi(descData.PPEvaluation.QualityRating)
		}
		if descData.PPEvaluation.DeliveryRating != "" {
			dRating, _ = strconv.Atoi(descData.PPEvaluation.DeliveryRating)
		}
		if descData.PPEvaluation.CommunicationRating != "" {
			cRating, _ = strconv.Atoi(descData.PPEvaluation.CommunicationRating)
		}

		// Fallback for sub-ratings to overall rating if not set
		if ratingVal > 0 {
			if qRating == 0 {
				qRating = int(ratingVal)
			}
			if dRating == 0 {
				dRating = int(ratingVal)
			}
			if cRating == 0 {
				cRating = int(ratingVal)
			}
		}

		// Recalculate average rating if sub-ratings are present and we want higher precision
		if qRating > 0 && dRating > 0 && cRating > 0 {
			ratingVal = float64(qRating+dRating+cRating) / 3.0
		}

		// Get satker/department
		satkerName, exists := satkerMap[p.IdSatker]
		if !exists {
			satkerName = "Kecamatan Besuk"
		}

		// Get or init item in map
		item, exists := vendorMap[vendorName]
		if !exists {
			item = &VendorPerformanceItem{
				VendorName:    vendorName,
				ServedSatkers: []string{},
				Reviews:       []VendorReview{},
			}
			vendorMap[vendorName] = item
		}

		item.TotalPackages++

		// Append satker if not already present
		satkerExists := false
		for _, s := range item.ServedSatkers {
			if s == satkerName {
				satkerExists = true
				break
			}
		}
		if !satkerExists {
			item.ServedSatkers = append(item.ServedSatkers, satkerName)
		}

		// Append review if a rating was given or sub ratings are valid
		if ratingVal > 0 || qRating > 0 {
			review := VendorReview{
				ProjectID:           p.ID,
				ProjectName:         p.Name,
				PPName:              bahp.VendorAddress, // Using VendorAddress as temporary placeholder if PP name is not directly stored
				Rating:              ratingVal,
				QualityRating:       qRating,
				DeliveryRating:      dRating,
				CommunicationRating: cRating,
				Status:              descData.PPEvaluation.VendorRatingStatus,
				Note:        descData.PPEvaluation.VendorRatingNote,
				Date:        p.UpdatedAt,
			}
			if review.PPName == "" || review.PPName == "Sesuai data terverifikasi e-Katalog LKPP" {
				review.PPName = "Pejabat Pengadaan (PP)"
			}
			item.Reviews = append(item.Reviews, review)
		}
	}

	// Calculate averages
	var result []VendorPerformanceItem
	for _, item := range vendorMap {
		var totalStars float64
		var totalQ, totalD, totalC float64
		ratedCount := 0
		for _, r := range item.Reviews {
			totalStars += r.Rating
			totalQ += float64(r.QualityRating)
			totalD += float64(r.DeliveryRating)
			totalC += float64(r.CommunicationRating)
			ratedCount++
		}
		
		if ratedCount > 0 {
			item.AverageRating = totalStars / float64(ratedCount)
			item.AverageQuality = totalQ / float64(ratedCount)
			item.AverageDelivery = totalD / float64(ratedCount)
			item.AverageComm = totalC / float64(ratedCount)
		} else {
			item.AverageRating = 0.0
			item.AverageQuality = 0.0
			item.AverageDelivery = 0.0
			item.AverageComm = 0.0
		}

		// Determine overall status based on average rating
		if item.AverageRating >= 4.5 {
			item.Status = "Sangat Baik"
		} else if item.AverageRating >= 3.5 {
			item.Status = "Baik"
		} else if item.AverageRating >= 2.5 {
			item.Status = "Cukup"
		} else if item.AverageRating > 0 {
			item.Status = "Kurang"
		} else {
			item.Status = "Belum Dinilai"
		}

		result = append(result, *item)
	}

	// Helper response structure
	writeJSON(w, http.StatusOK, result)
}
