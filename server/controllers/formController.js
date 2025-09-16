// server/controllers/formController.js
const math = require("mathjs");
const mongoSanitize = require("mongo-sanitize");
const AHPResult = require("../models/resultModel");
const Comparison = require("../models/Comparison");
const Indicator = require("../models/indicatorModel");
const Config = require("../models/formConfig"); // file: server/models/configModel.js -> export default dari formConfig.js-mu

// ----- Utilities -----
const createPairwiseMatrix = (pairwiseComparisons, criteria) => {
  const n = criteria.length;
  if (!n) return [];
  const matrix = math.identity(n).toArray();
  const index = Object.fromEntries(criteria.map((c, i) => [c, i]));

  (pairwiseComparisons || []).forEach(({ criteria_1, criteria_2, value }) => {
    if (!(criteria_1 in index) || !(criteria_2 in index)) return;
    const i = index[criteria_1];
    const j = index[criteria_2];
    const v = Number(value) || 1;
    matrix[i][j] = v;
    matrix[j][i] = v !== 0 ? 1 / v : 1;
  });

  return matrix;
};

const calculateMeanMatrix = (matrices) => {
  if (!matrices.length) return [];
  const acc = matrices.reduce(
    (sum, m) => math.add(sum, m),
    math.zeros(matrices[0].length, matrices[0].length)
  );
  return math.divide(acc, matrices.length).toArray();
};

const normalizeMatrix = (matrix) => {
  const m = math.matrix(matrix).toArray();
  if (!m.length) return [];
  const n = m.length;
  const colSums = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) colSums[j] += m[i][j];
  }
  return m.map((row) => row.map((val, j) => val / (colSums[j] || 1)));
};

const calculateWeights = (normalizedMatrix) => {
  const n = normalizedMatrix.length;
  if (!n) return [];
  return normalizedMatrix.map((row) => row.reduce((a, b) => a + b, 0) / n);
};

// Helper: filter hanya pasangan yg kedua kriterianya ada di set valid
const filterPairsFor = (pairs, validKeysSet) =>
  (pairs || []).filter(
    (p) => validKeysSet.has(p.criteria_1) && validKeysSet.has(p.criteria_2)
  );

// ===========================
// Controller: Submit Form
// ===========================
const submitPairwiseComparison = async (req, res) => {
  try {
    const sanitized = mongoSanitize(req.body);
    const { name, title, instansi, level_1, level_2, level_3, cr} = sanitized;

    // Ambil current iteration (sesi) dari Config
    const cfg = await Config.findOne({});
    const iteration = cfg?.iteration ?? 0;

    // Ambil daftar indikator dinamis saat ini (untuk menyimpan "snapshot" criteria)
    const allIndicators = await Indicator.find({}, { name: 1, category: 1 }).lean();
    const LEVEL3_CRITERIA = allIndicators.map((x) => x.name);

    // Susun pairwise level 3 dari payload map "K1_K2": value
    const pairwiseL3 = Object.keys(level_3 || {}).map((key) => {
      const [c1, c2] = key.split("_");
      return { criteria_1: c1, criteria_2: c2, value: level_3[key] };
    });

    // Level 1 & 2 hanya untuk kompatibilitas
    const newLevel1 = {
      comparison_type: "criteria",
      criteria: ["IFE", "ISL"],
      pairwise_comparison: [
        { criteria_1: "IFE", criteria_2: "ISL", value: level_1?.IFE_ISL ?? 1 },
      ],
    };
    const newLevel2 = [
      {
        comparison_type: "criteria",
        criteria: ["Financial", "Economy", "Social", "Environment"],
        pairwise_comparison: [
          {
            criteria_1: "Financial",
            criteria_2: "Economy",
            value: level_2?.financial_economy ?? 1,
          },
          {
            criteria_1: "Social",
            criteria_2: "Environment",
            value: level_2?.social_environment ?? 1,
          },
        ],
      },
    ];

    const newLevel3 = [
      {
        comparison_type: "criteria",
        criteria: LEVEL3_CRITERIA,
        pairwise_comparison: pairwiseL3,
      },
    ];

    const doc = new Comparison({
      name,
      title,
      instansi,
      iteration,
      level_1: newLevel1,
      level_2: newLevel2,
      level_3: newLevel3,
      cr: { IFE: cr?.IFE || 0, ISL: cr?.ISL || 0 },
    });

    await doc.save();

    res
      .status(201)
      .json({ status: 201, message: "Pairwise comparison successfully submitted!" });
  } catch (error) {
    console.error("submitPairwiseComparison error:", error);
    res.status(500).json({
      status: 500,
      message: "An error occurred while submitting the pairwise comparison.",
    });
  }
};

// ===========================
// Controller: Hitung AHP
// ===========================
const calculateAHPWeights = async (req, res) => {
  try { 
    // Ambil indikator dinamis (untuk mapping kategori & daftar kunci)
    const allIndicators = await Indicator.find({}, { name: 1, category: 1 }).lean();
    const IFE_KEYS = allIndicators.filter((x) => x.category === "IFE").map((x) => x.name);
    const ISL_KEYS = allIndicators.filter((x) => x.category === "ISL").map((x) => x.name);
    const IFE_SET = new Set(IFE_KEYS);
    const ISL_SET = new Set(ISL_KEYS);

    console.log("Indicators loaded:", IFE_KEYS, "IFE &", ISL_KEYS, "ISL");

    // Iteration(s) yang dihitung
    let iterations = [];
    if (typeof req.query.iteration !== "undefined") {
      iterations = [Number(req.query.iteration)];
    } else {
      iterations = await Comparison.distinct("iteration");
    }
    iterations.sort((a, b) => a - b);

    let lastPayload = null;

    for (const iteration of iterations) {
      const forms = await Comparison.find({ iteration });
      if (!forms?.length) continue;

      // Kumpulkan matrix per responden untuk tiap kelompok
      const level3MatricesIFE = forms.map((f) => {
        const allPairs = f.level_3?.[0]?.pairwise_comparison || [];
        const pairsIFE = filterPairsFor(allPairs, IFE_SET);
        return createPairwiseMatrix(pairsIFE, IFE_KEYS);
      });

      const level3MatricesISL = forms.map((f) => {
        const allPairs = f.level_3?.[0]?.pairwise_comparison || [];
        const pairsISL = filterPairsFor(allPairs, ISL_SET);
        return createPairwiseMatrix(pairsISL, ISL_KEYS);
      });

      // Mean -> Normalize -> Weights
      const meanIFE = calculateMeanMatrix(level3MatricesIFE);
      const normIFE = normalizeMatrix(meanIFE);
      const wIFE = calculateWeights(normIFE);

      const meanISL = calculateMeanMatrix(level3MatricesISL);
      const normISL = normalizeMatrix(meanISL);
      const wISL = calculateWeights(normISL);

      // Wrap ke object { IFE1: w, ... , ISL1: w, ... }
      const level3Weights = {};
      IFE_KEYS.forEach((k, i) => (level3Weights[k] = wIFE?.[i] ?? 0));
      ISL_KEYS.forEach((k, i) => (level3Weights[k] = wISL?.[i] ?? 0));

      // Level 1 & 2 fixed 1 (kompat)
      const level1Weights = { IFE: 1, ISL: 1 };
      const level2Weights = { Financial: 1, Economy: 1, Social: 1, Environment: 1 };

      await AHPResult.findOneAndUpdate(
        { iteration },
        { iteration, level1Weights, level2Weights, level3Weights },
        { upsert: true, new: true }
      );

      lastPayload = {
        iteration,
        level1Weights,
        level2Weights,
        level3Weights,
        normalizedMatrixLevel3IFE: normIFE,
        normalizedMatrixLevel3ISL: normISL,
      };
    }

    if (!lastPayload) {
      return res.status(200).json({
        status: 200,
        message: "No data to calculate.",
        level1Weights: {},
        level2Weights: {},
        level3Weights: {},
        iteration: null,
      });
    }

    return res.status(200).json({ status: 200, message: "Success", ...lastPayload });
  } catch (error) {
    console.error("calculateAHPWeights error:", error);
    res.status(500).json({
      status: 500,
      message: "An error occurred while calculating AHP weights.",
    });
  }
};

// ===========================
// Controller: Ambil Semua
// ===========================
const getAllComparisons = async (req, res) => {
  try {
    const comparisons = await Comparison.find();
    if (!comparisons?.length) return res.status(404).json([]);
    res.status(200).json({ status: 200, message: "success", comparisons });
  } catch (error) {
    console.error("getAllComparisons error:", error);
    res.status(500).json({
      status: 500,
      message: "An error occurred while fetching comparisons.",
    });
  }
};

const getAllWeights = async (req, res) => {
  try {
    const result = await AHPResult.find();
    if (!result?.length) return res.status(404).json([]);
    res.status(200).json({ status: 200, message: "Success", result });
  } catch (error) {
    console.error("getAllWeights error:", error);
    res.status(500).json({
      status: 500,
      message: "Something went wrong while getting final data",
    });
  }
};

module.exports = {
  submitPairwiseComparison,
  calculateAHPWeights,
  getAllComparisons,
  getAllWeights,
  createPairwiseMatrix,
  calculateMeanMatrix,
  normalizeMatrix,
  calculateWeights,
  filterPairsFor,
};
