// src/seed/seed-who.ts
import * as fs from "node:fs";
import * as path from "node:path";

import { sql } from "drizzle-orm";
import * as XLSX from "xlsx";
import { z } from "zod";

import { LOG_SERVICES, createLogger } from "@tans/logger/server";

import { db } from "#@/index";
import { whoGrowthData } from "#@/schema/immunization";

// ============================================================
// Constants
// ============================================================
export const DAY_COLUMN_REGEX = /^day$/i;
export const L_COLUMN_REGEX = /^L$/i;
export const M_COLUMN_REGEX = /^M$/i;
export const S_COLUMN_REGEX = /^S$/i;
// ── AT TOP OF FILE, replace the schema definitions ────────────
const ExcelRowSchema = z.object({
  Day: z.number(),
  L: z.number(),
  M: z.number(),
  S: z.number(),
  SD4neg: z.number(),
  SD3neg: z.number(),
  SD2neg: z.number(),
  SD1neg: z.number(),
  SD0: z.number(),
  SD1: z.number(),
  SD2: z.number(),
  SD3: z.number(),
  SD4: z.number()
});

type ExcelRow = z.infer<typeof ExcelRowSchema>;

// ── NEW: typed boundary for raw sheet rows ────────────────────
const RawSheetRowSchema = z.record(z.string(), z.unknown());
type RawSheetRow = z.infer<typeof RawSheetRowSchema>;
const logger = createLogger({
  operation: "seed_who_growth",
  origin: "seed",
  service: LOG_SERVICES.SERVER
});

type Gender = "male" | "female";
type MetricType = "weight" | "height";

type GrowthDataSet = {
  data: ExcelRow[];
  gender: Gender;
  type: MetricType;
};

// ============================================================
// File configuration
// ============================================================
const DATA_FILES = {
  weight: {
    male: "wfa-boys-zscore-expanded-tables.xlsx",
    female: "wfa-girls-zscore-expanded-tables.xlsx"
  },
  height: {
    male: "lhfa-boys-zscore-expanded-tables.xlsx",
    female: "lhfa-girls-zscore-expanded-tables.xlsx"
  }
} as const satisfies Record<MetricType, Record<Gender, string>>;

// ============================================================
// Column detection
// ============================================================
type ColumnMap = {
  dayCol: string;
  lCol: string;
  mCol: string;
  sCol: string;
  sdCols: {
    SD4neg: string;
    SD3neg: string;
    SD2neg: string;
    SD1neg: string;
    SD0: string;
    SD1: string;
    SD2: string;
    SD3: string;
    SD4: string;
  };
};

function detectColumnHeaders(headers: string[]): ColumnMap {
  const dayCol = headers.find((h) => DAY_COLUMN_REGEX.test(h)) ?? headers[0] ?? "Day";
  const lCol = headers.find((h) => L_COLUMN_REGEX.test(h)) ?? headers[1] ?? "L";
  const mCol = headers.find((h) => M_COLUMN_REGEX.test(h)) ?? headers[2] ?? "M";
  const sCol = headers.find((h) => S_COLUMN_REGEX.test(h)) ?? headers[3] ?? "S";

  const findSd = (keys: string[], fallback: string): string =>
    headers.find((h) => keys.includes(h) || keys.includes(h.toLowerCase())) ?? fallback;

  return {
    dayCol,
    lCol,
    mCol,
    sCol,
    sdCols: {
      SD4neg: findSd(["SD4neg", "sd4neg"], "SD4neg"),
      SD3neg: findSd(["SD3neg", "sd3neg"], "SD3neg"),
      SD2neg: findSd(["SD2neg", "sd2neg"], "SD2neg"),
      SD1neg: findSd(["SD1neg", "sd1neg"], "SD1neg"),
      SD0: findSd(["SD0", "sd0"], "SD0"),
      SD1: findSd(["SD1", "sd1"], "SD1"),
      SD2: findSd(["SD2", "sd2"], "SD2"),
      SD3: findSd(["SD3", "sd3"], "SD3"),
      SD4: findSd(["SD4", "sd4"], "SD4")
    }
  };
}

// ============================================================
// Row coercion
// ============================================================
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function coerceExcelRow(row: RawSheetRow, cols: ColumnMap): ExcelRow | null {
  const pick = (...keys: string[]): number | null => {
    for (const key of keys) {
      const n = toNumber(row[key]);
      if (n !== null) return n;
    }
    return null;
  };

  const candidate = {
    Day: pick(cols.dayCol, "Day", "day"),
    L: pick(cols.lCol, "L"),
    M: pick(cols.mCol, "M"),
    S: pick(cols.sCol, "S"),
    SD4neg: pick(cols.sdCols.SD4neg, "SD4neg") ?? 0,
    SD3neg: pick(cols.sdCols.SD3neg, "SD3neg") ?? 0,
    SD2neg: pick(cols.sdCols.SD2neg, "SD2neg") ?? 0,
    SD1neg: pick(cols.sdCols.SD1neg, "SD1neg") ?? 0,
    SD0: pick(cols.sdCols.SD0, "SD0"),
    SD1: pick(cols.sdCols.SD1, "SD1") ?? 0,
    SD2: pick(cols.sdCols.SD2, "SD2") ?? 0,
    SD3: pick(cols.sdCols.SD3, "SD3") ?? 0,
    SD4: pick(cols.sdCols.SD4, "SD4") ?? 0
  };

  const parsed = ExcelRowSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
// ============================================================
// File reader
// ============================================================
async function readExcelFile(filePath: string): Promise<ExcelRow[]> {
  logger.set({ event: "reading_file", file: path.basename(filePath) });

  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    logger.error(new Error("No worksheets found"), { file: path.basename(filePath) });
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    logger.error(new Error("Worksheet missing"), {
      file: path.basename(filePath),
      sheet: sheetName
    });
    return [];
  }

  const json = XLSX.utils.sheet_to_json<RawSheetRow>(sheet, {
    defval: "",
    raw: true
  });

  if (json.length === 0) {
    logger.warn("empty_sheet", { file: path.basename(filePath) });
    return [];
  }

  const first = json[0];
  if (!first) return [];

  const headers = Object.keys(first);
  const cols = detectColumnHeaders(headers);

  const rows: ExcelRow[] = [];
  for (const raw of json) {
    const parsed = RawSheetRowSchema.safeParse(raw);
    if (!parsed.success) continue;
    const coerced = coerceExcelRow(parsed.data, cols);
    if (coerced !== null) rows.push(coerced);
  }

  logger.set({
    event: "file_parsed",
    file: path.basename(filePath),
    totalRows: json.length,
    validRows: rows.length
  });

  return rows;
}

// ============================================================
// Dataset loading
// ============================================================
async function loadDataSets(baseDir: string): Promise<GrowthDataSet[]> {
  const datasets: GrowthDataSet[] = [];

  for (const [metricType, genderMap] of Object.entries(DATA_FILES) as [
    MetricType,
    Record<Gender, string>
  ][]) {
    for (const [gender, filename] of Object.entries(genderMap) as [Gender, string][]) {
      const filePath = path.join(baseDir, filename);

      if (!fs.existsSync(filePath)) {
        logger.warn("file_missing", { file: filePath });
        continue;
      }

      const data = await readExcelFile(filePath);
      if (data.length > 0) {
        datasets.push({ type: metricType, gender, data });
      }
    }
  }

  return datasets;
}

// ============================================================
// DB helpers
// ============================================================
async function truncateWhoGrowthData(): Promise<void> {
  logger.set({ event: "truncate_who_growth" });
  await db.delete(whoGrowthData);
}

type NewWhoRow = typeof whoGrowthData.$inferInsert;

function prepareInsertData(dataset: GrowthDataSet): NewWhoRow[] {
  const { type, gender, data } = dataset;
  const byAge = new Map<number, NewWhoRow>();

  for (const row of data) {
    const ageMonths = Math.round((row.Day / 30.44) * 10) / 10;

    byAge.set(ageMonths, {
      id: `who_${gender}_${type}_${row.Day}`,
      gender,
      metricType: type,
      ageDays: row.Day,
      ageMonths,
      L: row.L,
      M: row.M,
      S: row.S,
      sd4neg: row.SD4neg,
      sd3neg: row.SD3neg,
      sd2neg: row.SD2neg,
      sd1neg: row.SD1neg,
      sd0: row.SD0,
      sd1: row.SD1,
      sd2: row.SD2,
      sd3: row.SD3,
      sd4: row.SD4,
      dataSource: "WHO",
      version: "2006"
    });
  }

  return [...byAge.values()];
}

async function batchInsert(rows: NewWhoRow[], batchSize = 1000): Promise<number> {
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await db.insert(whoGrowthData).values(batch);
    inserted += batch.length;
  }

  return inserted;
}

// ============================================================
// Main entry
// ============================================================
export async function seedWHOGrowthData(dataDir?: string): Promise<void> {
  const startedAt = Date.now();
  const baseDir = dataDir ?? path.join(process.cwd(), "data");

  logger.set({ event: "seed_started", dataDir: baseDir });

  if (!fs.existsSync(baseDir)) {
    const err = new Error(`WHO data directory not found: ${baseDir}`);
    logger.error(err);
    logger.emit({ event: "seed_failed" });
    throw err;
  }

  const datasets = await loadDataSets(baseDir);

  if (datasets.length === 0) {
    const err = new Error("No WHO growth datasets were parsed");
    logger.error(err);
    logger.emit({ event: "seed_failed" });
    throw err;
  }

  await truncateWhoGrowthData();

  let totalInserted = 0;
  for (const dataset of datasets) {
    const insertRows = prepareInsertData(dataset);
    const inserted = await batchInsert(insertRows);
    totalInserted += inserted;

    logger.set({
      event: "dataset_inserted",
      gender: dataset.gender,
      metricType: dataset.type,
      inserted
    });
  }

  const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(whoGrowthData);

  logger.set({
    event: "seed_completed",
    durationMs: Date.now() - startedAt,
    datasets: datasets.length,
    totalInserted,
    databaseCount: countResult[0]?.count ?? 0
  });

  logger.emit();
}

// ============================================================
// CLI runner
// ============================================================
const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === `file://${path.resolve(process.argv[1])}`;

if (isDirectRun) {
  const dataDir = process.argv[2] ?? path.join(process.cwd(), "data");

  seedWHOGrowthData(dataDir)
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
