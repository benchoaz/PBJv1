package handlers

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"regexp"
	"strings"

	"gorm.io/gorm"
)

type AIValidatePPNRequest struct {
	ItemName       string  `json:"item_name"`
	Vendor         string  `json:"vendor"`
	Specification  string  `json:"specification"`
	Price          float64 `json:"price"`
	KodeRekening   string  `json:"kode_rekening"`
	UraianRekening string  `json:"uraian_rekening"`
	AIProvider     string  `json:"ai_provider"`
	AIKey          string  `json:"ai_key"`
}

type PPNCalculationSummary struct {
	HargaSatuanTayang    float64 `json:"harga_satuan_tayang"`
	HargaSebelumPajakDPP float64 `json:"harga_sebelum_pajak_dpp"`
	NilaiPPN             float64 `json:"nilai_ppn"`
}

type AIValidatePPNResponse struct {
	Success                bool                  `json:"success"`
	NamaBarang             string                `json:"nama_barang"`
	Penyedia               string                `json:"penyedia"`
	StatusPPN              string                `json:"status_ppn"`
	TarifPPNPersen         float64               `json:"tarif_ppn_persen"`
	DasarHukum             string                `json:"dasar_hukum"`
	MetodeDeteksi          string                `json:"metode_deteksi"` // "ai", "dpa_account", "scoring_fallback"
	Confidence             float64               `json:"confidence"`
	RekomendasiPerhitungan PPNCalculationSummary `json:"rekomendasi_perhitungan"`
	Error                  string                `json:"error,omitempty"`
}

type ValidatePPNHandler struct {
	db *gorm.DB
}

func NewValidatePPNHandler(db *gorm.DB) *ValidatePPNHandler {
	return &ValidatePPNHandler{db: db}
}

// Handle processes POST /api/ai/validate-ppn
func (h *ValidatePPNHandler) Handle(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req AIValidatePPNRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if strings.TrimSpace(req.ItemName) == "" {
		writeError(w, http.StatusBadRequest, "item_name tidak boleh kosong")
		return
	}

	price := req.Price
	if price <= 0 {
		price = 1
	}

	// 1. Coba Dynamic AI Reasoning jika key/provider tersedia atau tersimpan di database
	aiPrompt := fmt.Sprintf(`Anda adalah AI Validator untuk Sistem Manajemen PBJ Pemerintah Kabupaten Probolinggo.
Tugas utama Anda adalah menganalisis nama produk, spesifikasi, profil penyedia, dan kode rekening anggaran untuk menentukan apakah suatu item belanja dikenakan PPN atau Bebas/Tidak Dikenakan PPN berdasarkan regulasi perpajakan Indonesia terbaru (UU Harmonisasi Peraturan Perpajakan, PP Nomor 49 Tahun 2022, dan UU Hubungan Keuangan Pusat & Daerah / HKPD).

ATURAN KHUSUS DETEKSI MAKANAN & MINUMAN (JASA BOGA / RESTORAN / KATERING):
Ubah status PPN menjadi "Bebas/Tidak Dikenakan PPN" (Nilai PPN = 0, tarif = 0%%, DPP = Harga Satuan Tayang) jika produk memenuhi kriteria:
- Kategori Penyedia / Profil Usaha: Mengindikasikan jasa boga, katering, restoran, warung makan, cafe, bakery, atau dapur penyedia konsumsi.
- Nama/Spesifikasi: Merupakan makanan saji, kudapan, snack kotak, kue kotak, nasi kotak, nasi bungkus, prasmanan, coffee break, jamuan makan/minum rapat/kegiatan.
- Alasan Hukum: Makanan dan minuman yang disajikan oleh restoran, hotel, warung, dan sejenisnya serta jasa boga/catering merupakan objek Pajak Barang dan Jasa Tertentu (PBJT) daerah, sehingga Dikecualikan dari Objek PPN Pusat untuk menghindari pajak ganda (Pasal 4A UU PPN jo. UU HKPD No. 1/2022).

PERHATIAN: Barang fisik/wadah (contoh: kotak plastik mika kosong, styrofoam, dus kosong, tumbler, piring) atau makanan olahan kemasan pabrikan industri retail yang tahan lama TETAP DIKENAKAN PPN (BKP Umum).

Data Item:
- Nama Barang: "%s"
- Spesifikasi: "%s"
- Nama Penyedia: "%s"
- Harga Tayang Satuan: %.0f
- Kode / Uraian Rekening DPA: "%s" / "%s"

Berikan HANYA JSON murni tanpa markdown dengan format persis:
{
  "nama_barang": "%s",
  "penyedia": "%s",
  "status_ppn": "Bebas/Tidak Dikenakan PPN" ATAU "Dikenakan PPN",
  "tarif_ppn_persen": 0 ATAU 11,
  "dasar_hukum": "penjelasan ringkas dasar hukum",
  "rekomendasi_perhitungan": {
    "harga_satuan_tayang": %.0f,
    "harga_sebelum_pajak_dpp": <angka>,
    "nilai_ppn": <angka>
  }
}`,
		req.ItemName, req.Specification, req.Vendor, price, req.KodeRekening, req.UraianRekening,
		req.ItemName, req.Vendor, price,
	)

	aiResp, err := callAIWithFallback(h.db, req.AIProvider, req.AIKey, aiPrompt)
	if err == nil && aiResp != "" {
		cleaned := stripMarkdownJSON(aiResp)
		var parsed struct {
			NamaBarang             string                 `json:"nama_barang"`
			Penyedia               string                 `json:"penyedia"`
			StatusPPN              string                 `json:"status_ppn"`
			TarifPPNPersen         float64                `json:"tarif_ppn_persen"`
			DasarHukum             string                 `json:"dasar_hukum"`
			RekomendasiPerhitungan PPNCalculationSummary `json:"rekomendasi_perhitungan"`
		}
		if jsonErr := json.Unmarshal([]byte(cleaned), &parsed); jsonErr == nil && parsed.StatusPPN != "" {
			writeJSON(w, http.StatusOK, AIValidatePPNResponse{
				Success:                true,
				NamaBarang:             parsed.NamaBarang,
				Penyedia:               parsed.Penyedia,
				StatusPPN:              parsed.StatusPPN,
				TarifPPNPersen:         parsed.TarifPPNPersen,
				DasarHukum:             parsed.DasarHukum,
				MetodeDeteksi:          "ai",
				Confidence:             98.0,
				RekomendasiPerhitungan: parsed.RekomendasiPerhitungan,
			})
			return
		}
	}

	// 2. FALLBACK LEVEL 1 & 2: Jika AI tidak berfungsi / offline / error, gunakan klasifikasi Rekening DPA & Heuristik Kontekstual
	fallbackResult := evaluateFallbackPPN(req.ItemName, req.Vendor, req.Specification, req.KodeRekening, req.UraianRekening, price)
	writeJSON(w, http.StatusOK, fallbackResult)
}

// evaluateFallbackPPN melakukan evaluasi berbasis Bagan Akun Standar DPA dan Heuristik Kontekstual saat AI offline
func evaluateFallbackPPN(itemName, vendor, specs, kodeRekening, uraianRekening string, price float64) AIValidatePPNResponse {
	cleanItem := strings.ToLower(itemName)
	cleanVendor := strings.ToLower(vendor)
	cleanSpecs := strings.ToLower(specs)
	cleanUraian := strings.ToLower(uraianRekening)
	cleanKode := strings.ReplaceAll(kodeRekening, ".", "")

	// A. Cek Bagan Akun Standar (BAS) Belanja Makanan & Minuman
	// 5.1.02.01.01.0052: Makan Minum Rapat
	// 5.1.02.01.01.0053: Jamuan Tamu
	// 5.1.02.01.01.0054: Aktivitas Lapangan
	isMakanMinumAccount := strings.Contains(cleanKode, "510201010052") ||
		strings.Contains(cleanKode, "510201010053") ||
		strings.Contains(cleanKode, "510201010054") ||
		(strings.Contains(cleanUraian, "makan") && strings.Contains(cleanUraian, "minum")) ||
		strings.Contains(cleanUraian, "jamuan") ||
		strings.Contains(cleanUraian, "konsumsi")

	// Pengecualian negatif (kontainer/wadah plastik kosong bukan makanan)
	isPhysicalEquipment := regexp.MustCompile(`(kontainer|container|kotak mika|mika plastik|box mika|piring|gelas plastik kosong|dus kosong|sendok garpu|plastik klip)`).MatchString(cleanItem)

	if isMakanMinumAccount && !isPhysicalEquipment {
		return AIValidatePPNResponse{
			Success:        true,
			NamaBarang:     itemName,
			Penyedia:       vendor,
			StatusPPN:      "Bebas/Tidak Dikenakan PPN",
			TarifPPNPersen: 0,
			DasarHukum:     "Pasal 4A ayat (2) UU PPN jo. UU HKPD No. 1/2022 (Rekening Belanja Makanan & Minuman merupakan objek PBJT Pajak Daerah, bukan PPN)",
			MetodeDeteksi:  "dpa_account",
			Confidence:     99.0,
			RekomendasiPerhitungan: PPNCalculationSummary{
				HargaSatuanTayang:    price,
				HargaSebelumPajakDPP: price,
				NilaiPPN:             0,
			},
		}
	}

	// B. Multi-Factor Contextual Scoring saat AI tidak tersedia
	score := 0

	// Vendor score
	if regexp.MustCompile(`(catering|katering|resto|restoran|warung|rumah makan|cafe|café|bakery|dapur)`).MatchString(cleanVendor) {
		score += 40
	}

	// Item / commodity score
	if regexp.MustCompile(`(snack|kudapan|kue|nasi kotak|nasi bungkus|prasmanan|coffee break|tumpeng|konsumsi|makanan|minuman)`).MatchString(cleanItem) ||
		regexp.MustCompile(`(snack|kue|nasi|konsumsi)`).MatchString(cleanSpecs) {
		score += 40
	}

	// Unit / Presentation
	if regexp.MustCompile(`(kotak|box|porsi|dus|paket|bungkus)`).MatchString(cleanItem) ||
		regexp.MustCompile(`(kotak|box|porsi|dus|paket)`).MatchString(cleanSpecs) {
		score += 20
	}

	// Negative penalty
	if isPhysicalEquipment {
		score -= 100
	}

	if score >= 60 {
		return AIValidatePPNResponse{
			Success:        true,
			NamaBarang:     itemName,
			Penyedia:       vendor,
			StatusPPN:      "Bebas/Tidak Dikenakan PPN",
			TarifPPNPersen: 0,
			DasarHukum:     "Pasal 4A UU PPN jo. PP 49/2022 & UU HKPD (Makanan/minuman sediaan jasa boga/katering merupakan objek PBJT Daerah)",
			MetodeDeteksi:  "scoring_fallback",
			Confidence:     85.0,
			RekomendasiPerhitungan: PPNCalculationSummary{
				HargaSatuanTayang:    price,
				HargaSebelumPajakDPP: price,
				NilaiPPN:             0,
			},
		}
	}

	// C. Default: Barang/Jasa Kena Pajak (BKP Umum)
	// Formula resmi INAPROC: DPP = Harga / 1.11, PPN = (11/12 x DPP) x 12% = 11% Efektif
	dpp := math.Floor(price / 1.11)
	ppn := math.Round((11.0 / 12.0) * dpp * 0.12)

	return AIValidatePPNResponse{
		Success:        true,
		NamaBarang:     itemName,
		Penyedia:       vendor,
		StatusPPN:      "Dikenakan PPN",
		TarifPPNPersen: 11,
		DasarHukum:     "Pasal 4 ayat (1) UU PPN jo. UU Harmonisasi Peraturan Perpajakan (Barang Kena Pajak Umum)",
		MetodeDeteksi:  "scoring_fallback",
		Confidence:     90.0,
		RekomendasiPerhitungan: PPNCalculationSummary{
			HargaSatuanTayang:    price,
			HargaSebelumPajakDPP: dpp,
			NilaiPPN:             ppn,
		},
	}
}
