const math = require('mathjs');
const mongoSanitize = require('mongo-sanitize');
const AHPResult = require('../models/resultModel')
const Comparison = require('../models/Comparison')

// Mapping kota -> iteration
const CITY_TO_ITER = {
  Bitung: 0,
  Jakarta: 1,
  Palembang: 2,
  Balikpapan: 3,
  Semarang: 4,
};

// Level 1 & 2 criteria (tetap ada untuk kompatibilitas data, tapi bobotnya akan diset 1)
const LEVEL1_CRITERIA = ['IFE', 'ISL'];
const LEVEL2_CRITERIA = ['Financial', 'Economy', 'Social', 'Environment'];

// ---------------------------
// Indicator Descriptions
// ---------------------------
const IFE_INDICATORS = {
  IFE1: "Dampak terhadap pengembangan ekonomi lokal",
  IFE2: "Dampak terhadap keuntungan ekonomi jangka panjang",
  IFE3: "Dampak terhadap pemanfaatan sumber daya lokal",
  IFE4: "Kontribusi terhadap kehidupan lebih baik warga kota",
  IFE5: "Dampak multiplier & jejaring ekonomi/industri lain",
  IFE6: "Penerimaan langsung dari proyek",
  IFE7: "Pengaruh terhadap alokasi anggaran berjalan",
  IFE8: "Pengalokasian proyek di dalam APBD/APBN",
  IFE9: "Kebutuhan dukungan eksternal",
  IFE10: "Risiko finansial/ekonomi terhadap keberlanjutan proyek",
  IFE11: "Risiko politik terhadap keberlanjutan proyek",
  IFE12: "Strategi mitigasi risiko dalam penyelenggaraan proyek",
};

const ISL_INDICATORS = {
  ISL1: "Dampak terhadap kualitas lingkungan sekitar",
  ISL2: "Kontribusi dalam keberlanjutan jangka panjang",
  ISL3: "Kontribusi terhadap kesehatan masyarakat lokal",
  ISL4: "Kontribusi terhadap adaptasi perubahan iklim",
  ISL5: "Kontribusi terhadap mitigasi perubahan iklim",
  ISL6: "Kontribusi peningkatan kualitas ruang publik kota",
  ISL7: "Dampak/risiko terhadap keanekaragaman hayati",
  ISL8: "Inovasi/keterbaruan untuk perbaikan masa depan",
  ISL9: "Dampak ke masyarakat akibat alih fungsi lahan",
  ISL10: "Perbaikan lingkungan masyarakat berpenghasilan rendah",
};

// ---------------------------
// Level 3 criteria (pakai kode)
// ---------------------------
const LEVEL3_CRITERIA = [
  ...Object.keys(IFE_INDICATORS),
  ...Object.keys(ISL_INDICATORS),
];


// Buat matriks pairwise dari daftar perbandingan dan daftar kriteria
const createPairwiseMatrix = (pairwiseComparisons, criteria) => {
  const n = criteria.length;
  const matrix = math.identity(n).toArray();
  const index = Object.fromEntries(criteria.map((c, i) => [c, i]));

  pairwiseComparisons.forEach(({ criteria_1, criteria_2, value }) => {
    if (!(criteria_1 in index) || !(criteria_2 in index)) return;
    const i = index[criteria_1];
    const j = index[criteria_2];
    const v = Number(value) || 1;
    matrix[i][j] = v;
    matrix[j][i] = v !== 0 ? 1 / v : 1; // jaga-jaga
  });

  return matrix;
};

const calculateMeanMatrix = (matrices) => {
  if (!matrices.length) return [];
  const acc = matrices.reduce((sum, m) => math.add(sum, m), math.zeros(matrices[0].length, matrices[0].length));
  return math.divide(acc, matrices.length).toArray();
};

const normalizeMatrix = (matrix) => {
  const m = math.matrix(matrix).toArray();
  if (!m.length) return [];
  const n = m.length;

  // jumlah kolom
  const colSums = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += m[i][j];
    }
  }

  // normalisasi
  const norm = m.map(row =>
    row.map((val, j) => {
      const denom = colSums[j] || 1;
      return val / denom;
    })
  );

  return norm;
};

const calculateWeights = (normalizedMatrix) => {
  const n = normalizedMatrix.length;
  if (!n) return [];
  // rata-rata per baris
  return normalizedMatrix.map(row => row.reduce((a, b) => a + b, 0) / n);
};

// ---------------------------
// Controller: Submit Form
// ---------------------------
const submitPairwiseComparison = async (req, res) => {
  try {
    const sanitized = mongoSanitize(req.body);
    const { name, title, instansi, level_1, level_2, level_3, city } = sanitized;

    const iteration = CITY_TO_ITER[city] ?? 6; // default 6 jika kota tidak dikenali

    // Level 1: tetap simpan pairwise yang dikirim (value = 1)
    const newLevel1 = {
      comparison_type: 'criteria',
      criteria: LEVEL1_CRITERIA,
      pairwise_comparison: [
        {
          criteria_1: 'IFE',
          criteria_2: 'ISL',
          value: level_1?.IFE_ISL ?? 1,
        },
      ],
    };

    // Level 2: tetap simpan pairwise yang dikirim (value = 1)
    const newLevel2 = [
      {
        comparison_type: 'criteria',
        criteria: LEVEL2_CRITERIA,
        pairwise_comparison: [
          {
            criteria_1: 'Financial',
            criteria_2: 'Economy',
            value: level_2?.financial_economy ?? 1,
          },
          {
            criteria_1: 'Social',
            criteria_2: 'Environment',
            value: level_2?.social_environment ?? 1,
          },
        ],
      },
    ];

    // Level 3: bangun dari key "K1_K2" yang dikirim client
    const pairwiseL3 = Object.keys(level_3 || {}).map((key) => {
      const [c1, c2] = key.split('_');
      return {
        criteria_1: c1,
        criteria_2: c2,
        value: level_3[key],
      };
    });

    const newLevel3 = [
      {
        comparison_type: 'criteria',
        criteria: LEVEL3_CRITERIA,
        pairwise_comparison: pairwiseL3,
      },
    ];

    // Simpan ke DB
    const doc = new Comparison({
      name,
      title,
      instansi,
      iteration,
      level_1: newLevel1,
      level_2: newLevel2,
      level_3: newLevel3,
    });

    await doc.save();

    res.status(201).json({ status: 201, message: 'Pairwise comparison successfully submitted!' });
  } catch (error) {
    console.error('submitPairwiseComparison error:', error);
    res.status(500).json({ status: 500, message: 'An error occurred while submitting the pairwise comparison.' });
  }
};

// ---------------------------
// Controller: Hitung AHP & Simpan
// ---------------------------

// ---------------------------
// Indicator keys (helper arrays)
// ---------------------------
const IFE_KEYS = Object.keys(IFE_INDICATORS);
const ISL_KEYS = Object.keys(ISL_INDICATORS);

// Helper: filter pairwise utk 1 kelompok
const filterPairsFor = (pairs, validKeysSet) =>
  (pairs || []).filter(p => validKeysSet.has(p.criteria_1) && validKeysSet.has(p.criteria_2));

const calculateAHPWeights = async (req, res) => {
  try {
    // pilih iteration
    let iterations = [];
    if (typeof req.query.iteration !== 'undefined') {
      iterations = [Number(req.query.iteration)];
    } else {
      iterations = await Comparison.distinct('iteration');
    }
    iterations.sort((a, b) => a - b);

    let respPayload = null;

    // set utk filter cepat
    const IFE_SET = new Set(IFE_KEYS);
    const ISL_SET = new Set(ISL_KEYS);

    for (const iteration of iterations) {
      const forms = await Comparison.find({ iteration });
      if (!forms || forms.length === 0) continue;

      // --- LEVEL 1 & 2 (tetap 1) ---
      const level1Weights = { IFE: 1, ISL: 1 };
      const level2Weights = { Financial: 1, Economy: 1, Social: 1, Environment: 1 };

      // --- LEVEL 3: hitung PER-KELOMPOK ---
      // Kumpulkan matriks dari setiap responden untuk IFE & ISL secara terpisah
      const level3MatricesIFE = forms.map(f => {
        const allPairs = f.level_3?.[0]?.pairwise_comparison || [];
        const pairsIFE = filterPairsFor(allPairs, IFE_SET);
        return createPairwiseMatrix(pairsIFE, IFE_KEYS);
      });

      const level3MatricesISL = forms.map(f => {
        const allPairs = f.level_3?.[0]?.pairwise_comparison || [];
        const pairsISL = filterPairsFor(allPairs, ISL_SET);
        return createPairwiseMatrix(pairsISL, ISL_KEYS);
      });

      // Mean & Normalize per-kelompok
      const meanIFE = calculateMeanMatrix(level3MatricesIFE);
      const normIFE = normalizeMatrix(meanIFE);
      const wIFE = calculateWeights(normIFE); // array sepanjang IFE_KEYS

      const meanISL = calculateMeanMatrix(level3MatricesISL);
      const normISL = normalizeMatrix(meanISL);
      const wISL = calculateWeights(normISL); // array sepanjang ISL_KEYS

      // Bungkus kembali ke object { IFE1:..., ISL1:... }.
      const level3Weights = {};
      IFE_KEYS.forEach((k, i) => (level3Weights[k] = wIFE?.[i] ?? 0));
      ISL_KEYS.forEach((k, i) => (level3Weights[k] = wISL?.[i] ?? 0));

      // Simpan hasil per iteration
      await AHPResult.findOneAndUpdate(
        { iteration },
        { iteration, level1Weights, level2Weights, level3Weights },
        { new: true, upsert: true }
      );

      // Siapkan payload (sekalian kirim normalized per-kelompok biar mudah debug)
      respPayload = {
        iteration,
        level1Weights,
        level2Weights,
        level3Weights,
        // optional untuk debug/visualisasi:
        normalizedMatrixLevel3IFE: normIFE,
        normalizedMatrixLevel3ISL: normISL,
      };
    }

    if (!respPayload) {
      return res.status(200).json({
        status: 200,
        message: 'No data to calculate.',
        level1Weights: {},
        level2Weights: {},
        level3Weights: {},
        iteration: null,
      });
    }

    return res.status(200).json({ status: 200, message: 'Success', ...respPayload });
  } catch (error) {
    console.error('calculateAHPWeights error:', error);
    res.status(500).json({ status: 500, message: 'An error occurred while calculating AHP weights.' });
  }
};


// ---------------------------
// Controller: Ambil Semua Comparison
// ---------------------------
const getAllComparisons = async (req, res) => {
  try {
    const comparisons = await Comparison.find();
    if (!comparisons || comparisons.length === 0) {
      return res.status(404).json([]);
    }
    res.status(200).json({
      status: 200,
      message: 'success',
      comparisons,
    });
  } catch (error) {
    console.error('getAllComparisons error:', error);
    res.status(500).json({ status: 500, message: 'An error occurred while fetching comparisons.' });
  }
};

// ---------------------------
// Controller: Ambil Semua Hasil (AHPResult)
// ---------------------------
const getAllWeights = async (req, res) => {
  try {
    const result = await AHPResult.find();
    if (!result || result.length === 0) {
      return res.status(404).json([]);
    }

    res.status(200).json({
      status: 200,
      message: 'Success',
      result,
    });
  } catch (error) {
    console.error('getAllWeights error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Something went wrong while getting final data',
    });
  }
};

module.exports = {
  calculateAHPWeights,
  submitPairwiseComparison,
  getAllComparisons,
  getAllWeights,
};