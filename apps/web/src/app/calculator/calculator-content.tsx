"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  TrendingUp,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Landmark,
  TreePine,
  Home,
  Globe,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Badge, Input, Card, CardContent } from "@onyx/ui";
import { formatPrice, formatPriceFull } from "@/lib/utils";
import {
  calculateEMI,
  calculateROI,
  calculateBreakEven,
  convertCurrency,
  CURRENCY_RATES,
  type ROIProjection,
} from "@/lib/calculator";

// ─── Animation Variants ─────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

// ─── Format Helpers ─────────────────────────────────────

function formatCompact(value: number): string {
  if (Math.abs(value) >= 10000000)
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatForeignCompact(value: number, symbol: string): string {
  if (Math.abs(value) >= 1000000)
    return `${symbol}${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000)
    return `${symbol}${(value / 1000).toFixed(1)}K`;
  return `${symbol}${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// ─── Custom Tooltip ─────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-onyx-900/95 backdrop-blur-xl border border-cream/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-cream/78 text-xs font-body mb-2">Year {label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm font-body">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-cream/81">{entry.name}:</span>
          <span className="text-cream font-medium">
            {formatCompact(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Slider Component ───────────────────────────────────

function GoldSlider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  suffix: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-body text-cream/81">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v >= min && v <= max) onChange(v);
            }}
            className="w-16 h-8 text-right text-sm font-body text-gold bg-onyx-900/60 border border-cream/10 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-gold/30"
          />
          <span className="text-xs text-cream/86">{suffix}</span>
        </div>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-onyx-800" />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold/70 to-gold"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gold shadow-lg shadow-gold/30 border-2 border-onyx-950 pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    </div>
  );
}

// ─── Price Input ────────────────────────────────────────

function PriceInput({
  value,
  onChange,
  label,
  prefix = "₹",
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(value > 0 ? value.toString() : "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setDisplay(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num)) onChange(num);
    else if (raw === "") onChange(0);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-body text-cream/81">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-body text-sm">
          {prefix}
        </span>
        <Input
          type="text"
          value={display}
          onChange={handleChange}
          className="pl-8"
          placeholder="0"
        />
        {value > 0 && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-cream/82 font-body">
            {formatPrice(value)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────

export function CalculatorPageContent() {
  // --- Inputs ---
  const [purchasePrice, setPurchasePrice] = useState(5000000);
  const [propertyType, setPropertyType] = useState<"farmland" | "residential">(
    "farmland"
  );
  const [appreciation, setAppreciation] = useState(10);
  const [rentalYield, setRentalYield] = useState(2);
  const [showLoan, setShowLoan] = useState(false);
  const [loanAmount, setLoanAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(9);
  const [loanTenure, setLoanTenure] = useState(15);
  const [projectionYears] = useState(15);

  // --- Currency ---
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  // --- Table toggle ---
  const [tableOpen, setTableOpen] = useState(false);

  // --- Switch property type ---
  const handleTypeSwitch = useCallback(
    (type: "farmland" | "residential") => {
      setPropertyType(type);
      if (type === "farmland") {
        setAppreciation(10);
        setRentalYield(2);
      } else {
        setAppreciation(7);
        setRentalYield(4);
      }
    },
    []
  );

  // --- Derived calculations ---
  const projections = useMemo(
    () =>
      calculateROI({
        purchasePrice,
        appreciationRate: appreciation,
        rentalYield,
        loanAmount: showLoan ? loanAmount : 0,
        interestRate,
        loanTenure,
        projectionYears,
      }),
    [
      purchasePrice,
      appreciation,
      rentalYield,
      showLoan,
      loanAmount,
      interestRate,
      loanTenure,
      projectionYears,
    ]
  );

  const emiResult = useMemo(
    () =>
      showLoan && loanAmount > 0
        ? calculateEMI(loanAmount, interestRate, loanTenure * 12)
        : null,
    [showLoan, loanAmount, interestRate, loanTenure]
  );

  const breakEvenYear = useMemo(
    () => calculateBreakEven(projections),
    [projections]
  );

  const year10 = projections[9] || projections[projections.length - 1];
  const downPayment = purchasePrice - (showLoan ? loanAmount : 0);

  // --- Chart data (prepend year 0) ---
  const chartData = useMemo(() => {
    const base = {
      year: 0,
      "Property Value": purchasePrice,
      "Total Invested": downPayment,
      "Cumulative Rental": 0,
    };
    return [
      base,
      ...projections.map((p) => ({
        year: p.year,
        "Property Value": p.propertyValue,
        "Total Invested": p.totalInvested,
        "Cumulative Rental": p.cumulativeRental,
      })),
    ];
  }, [projections, purchasePrice, downPayment]);

  // --- Comparison data (farmland vs residential) ---
  const comparisonData = useMemo(() => {
    const farmlandProj = calculateROI({
      purchasePrice,
      appreciationRate: 10,
      rentalYield: 2,
      loanAmount: showLoan ? loanAmount : 0,
      interestRate,
      loanTenure,
      projectionYears,
    });
    const residentialProj = calculateROI({
      purchasePrice,
      appreciationRate: 7,
      rentalYield: 4,
      loanAmount: showLoan ? loanAmount : 0,
      interestRate,
      loanTenure,
      projectionYears,
    });
    return farmlandProj.map((fp, i) => ({
      year: fp.year,
      "Farmland Net Worth": fp.netWorth,
      "Residential Net Worth": residentialProj[i]?.netWorth ?? 0,
      "Farmland ROI %": fp.roiPercent,
      "Residential ROI %": residentialProj[i]?.roiPercent ?? 0,
    }));
  }, [purchasePrice, showLoan, loanAmount, interestRate, loanTenure, projectionYears]);

  // --- Currency conversion ---
  const converted = convertCurrency(purchasePrice, selectedCurrency);
  const topCurrencies = ["USD", "GBP", "AED", "SGD"];

  return (
    <div className="min-h-screen bg-onyx-950">
      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center max-w-2xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-6">FOR INVESTORS</Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-cream leading-tight"
            >
              Investment{" "}
              <span className="text-gold">Calculator</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-4 text-lg font-body text-cream/78"
            >
              Make data-driven investment decisions with our ROI projector
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Left Column — Inputs (2/5) ───────────── */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 space-y-6"
          >
            <motion.div variants={fadeUp} custom={3}>
              <Card className="p-6 space-y-6">
                {/* Purchase Price */}
                <PriceInput
                  value={purchasePrice}
                  onChange={setPurchasePrice}
                  label="Purchase Price"
                />

                {/* Property Type Toggle */}
                <div className="space-y-2">
                  <label className="text-sm font-body text-cream/81">
                    Property Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleTypeSwitch("farmland")}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-body transition-all duration-300 ${
                        propertyType === "farmland"
                          ? "bg-gold/15 text-gold border border-gold/30"
                          : "bg-onyx-800/50 text-cream/86 border border-cream/5 hover:border-cream/10"
                      }`}
                    >
                      <TreePine className="w-4 h-4" />
                      Farmland
                    </button>
                    <button
                      onClick={() => handleTypeSwitch("residential")}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-body transition-all duration-300 ${
                        propertyType === "residential"
                          ? "bg-gold/15 text-gold border border-gold/30"
                          : "bg-onyx-800/50 text-cream/86 border border-cream/5 hover:border-cream/10"
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      Residential
                    </button>
                  </div>
                </div>

                {/* Appreciation Slider */}
                <GoldSlider
                  value={appreciation}
                  min={3}
                  max={20}
                  step={0.5}
                  onChange={setAppreciation}
                  label="Expected Appreciation"
                  suffix="%"
                />

                {/* Rental Yield Slider */}
                <GoldSlider
                  value={rentalYield}
                  min={0}
                  max={10}
                  step={0.5}
                  onChange={setRentalYield}
                  label="Annual Rental Yield"
                  suffix="%"
                />

                {/* Loan Details (expandable) */}
                <div className="border border-cream/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowLoan(!showLoan)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-body text-cream/81 hover:text-cream/80 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Landmark className="w-4 h-4" />
                      Loan Details
                    </span>
                    {showLoan ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {showLoan && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="px-4 pb-4 space-y-4 border-t border-cream/5"
                    >
                      <div className="pt-4">
                        <PriceInput
                          value={loanAmount}
                          onChange={setLoanAmount}
                          label="Loan Amount"
                        />
                      </div>
                      <GoldSlider
                        value={interestRate}
                        min={5}
                        max={15}
                        step={0.25}
                        onChange={setInterestRate}
                        label="Interest Rate"
                        suffix="%"
                      />
                      <GoldSlider
                        value={loanTenure}
                        min={1}
                        max={30}
                        step={1}
                        onChange={setLoanTenure}
                        label="Loan Tenure"
                        suffix="yrs"
                      />
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* ── Right Column — Results (3/5) ─────────── */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="lg:col-span-3 space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div variants={fadeUp} custom={4}>
                <Card className="p-5">
                  <p className="text-xs font-body text-cream/86 uppercase tracking-wider">
                    Total Investment
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold text-cream">
                    {formatPrice(year10?.totalInvested ?? purchasePrice)}
                  </p>
                  <p className="mt-1 text-xs font-body text-cream/82">
                    Down payment + EMIs
                  </p>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp} custom={5}>
                <Card className="p-5">
                  <p className="text-xs font-body text-cream/86 uppercase tracking-wider">
                    Property Value at 10Y
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold text-gold">
                    {formatPrice(year10?.propertyValue ?? purchasePrice)}
                  </p>
                  <p className="mt-1 text-xs font-body text-cream/82">
                    {appreciation}% annual appreciation
                  </p>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp} custom={6}>
                <Card className="p-5">
                  <p className="text-xs font-body text-cream/86 uppercase tracking-wider">
                    Net ROI at 10Y
                  </p>
                  <p
                    className={`mt-2 font-display text-2xl font-semibold ${
                      (year10?.roiPercent ?? 0) >= 0
                        ? "text-gold"
                        : "text-red-400"
                    }`}
                  >
                    {(year10?.roiPercent ?? 0) >= 0 ? "+" : ""}
                    {year10?.roiPercent ?? 0}%
                  </p>
                  <p className="mt-1 text-xs font-body text-cream/82">
                    {breakEvenYear
                      ? `Break-even in year ${breakEvenYear}`
                      : "No break-even in projection"}
                  </p>
                </Card>
              </motion.div>
            </div>

            {/* Monthly EMI Card */}
            {emiResult && emiResult.emi > 0 && (
              <motion.div variants={fadeUp} custom={7}>
                <Card className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-body text-cream/86 uppercase tracking-wider">
                      Monthly EMI
                    </p>
                    <p className="mt-1 font-display text-3xl font-semibold text-cream">
                      {formatPriceFull(Math.round(emiResult.emi))}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-body text-cream/86">
                      Total Interest:{" "}
                      <span className="text-cream/81">
                        {formatPrice(Math.round(emiResult.totalInterest))}
                      </span>
                    </p>
                    <p className="text-xs font-body text-cream/86">
                      Total Payment:{" "}
                      <span className="text-cream/81">
                        {formatPrice(Math.round(emiResult.totalPayment))}
                      </span>
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Appreciation Chart */}
            <motion.div variants={fadeUp} custom={8}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-cream">
                      Value Projection
                    </h3>
                    <p className="text-xs font-body text-cream/86 mt-1">
                      15-year property value forecast
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-gold/50" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="goldGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#1E4793"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#1E4793"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="emeraldGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#34d399"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#34d399"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(16,26,46,0.06)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        stroke="rgba(16,26,46,0.15)"
                        tick={{ fill: "rgba(16,26,46,0.55)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="rgba(16,26,46,0.15)"
                        tick={{ fill: "rgba(16,26,46,0.55)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => formatCompact(v)}
                        width={70}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="Property Value"
                        stroke="#1E4793"
                        strokeWidth={2}
                        fill="url(#goldGrad)"
                        animationDuration={1200}
                      />
                      <Area
                        type="monotone"
                        dataKey="Total Invested"
                        stroke="rgba(16,26,46,0.55)"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fill="none"
                        animationDuration={1200}
                      />
                      <Area
                        type="monotone"
                        dataKey="Cumulative Rental"
                        stroke="#34d399"
                        strokeWidth={2}
                        fill="url(#emeraldGrad)"
                        animationDuration={1200}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 mt-4 text-xs font-body">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-gold rounded" />
                    <span className="text-cream/86">Property Value</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-cream/40 rounded border-dashed" />
                    <span className="text-cream/86">Total Invested</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-emerald-400 rounded" />
                    <span className="text-cream/86">Rental Income</span>
                  </span>
                </div>
              </Card>
            </motion.div>

            {/* Year-by-Year Table */}
            <motion.div variants={fadeUp} custom={9}>
              <Card className="overflow-hidden">
                <button
                  onClick={() => setTableOpen(!tableOpen)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <div>
                    <h3 className="font-display text-lg font-semibold text-cream">
                      Year-by-Year Breakdown
                    </h3>
                    <p className="text-xs font-body text-cream/86 mt-0.5">
                      Detailed projections for each year
                    </p>
                  </div>
                  {tableOpen ? (
                    <ChevronUp className="w-5 h-5 text-cream/86" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-cream/86" />
                  )}
                </button>
                {tableOpen && (
                  <div className="px-6 pb-6 overflow-x-auto">
                    <table className="w-full text-sm font-body">
                      <thead>
                        <tr className="border-b border-cream/5">
                          <th className="text-left py-3 text-cream/86 font-medium">
                            Year
                          </th>
                          <th className="text-right py-3 text-cream/86 font-medium">
                            Property Value
                          </th>
                          <th className="text-right py-3 text-cream/86 font-medium">
                            Rental Income
                          </th>
                          <th className="text-right py-3 text-cream/86 font-medium">
                            EMI Paid
                          </th>
                          <th className="text-right py-3 text-cream/86 font-medium">
                            Net Worth
                          </th>
                          <th className="text-right py-3 text-cream/86 font-medium">
                            ROI %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {projections.map((p) => (
                          <tr
                            key={p.year}
                            className={`border-b border-cream/3 ${
                              p.roiPercent >= 0
                                ? "hover:bg-gold/3"
                                : "hover:bg-red-400/3"
                            } transition-colors`}
                          >
                            <td className="py-3 text-cream/88">{p.year}</td>
                            <td className="py-3 text-right text-cream/88">
                              {formatPrice(p.propertyValue)}
                            </td>
                            <td className="py-3 text-right text-emerald-400/80">
                              {formatPrice(p.cumulativeRental)}
                            </td>
                            <td className="py-3 text-right text-cream/78">
                              {formatPrice(p.cumulativeEMI)}
                            </td>
                            <td
                              className={`py-3 text-right font-medium ${
                                p.netWorth >= 0
                                  ? "text-gold"
                                  : "text-red-400"
                              }`}
                            >
                              {p.netWorth >= 0 ? "+" : ""}
                              {formatPrice(p.netWorth)}
                            </td>
                            <td
                              className={`py-3 text-right font-medium ${
                                p.roiPercent >= 0
                                  ? "text-gold"
                                  : "text-red-400"
                              }`}
                            >
                              {p.roiPercent >= 0 ? "+" : ""}
                              {p.roiPercent}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Currency Converter Section ──────────────── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-20"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-5 h-5 text-gold/60" />
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-cream">
                For NRI Investors
              </h2>
            </div>
            <p className="text-sm font-body text-cream/86">
              See your investment in your preferred currency
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Converter */}
            <motion.div variants={fadeUp} custom={1}>
              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-body text-cream/86 uppercase tracking-wider">
                      Property Price (INR)
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-cream">
                      {formatPriceFull(purchasePrice)}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-cream/79" />
                  <div className="text-right">
                    <p className="text-xs font-body text-cream/86 uppercase tracking-wider">
                      {CURRENCY_RATES[selectedCurrency]?.name}
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-gold">
                      {converted.symbol}
                      {converted.amount.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-body text-cream/86">
                    Target Currency
                  </label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full h-11 rounded-lg border border-cream/10 bg-onyx-900/60 px-4 text-sm text-cream font-body focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50"
                  >
                    {Object.entries(CURRENCY_RATES).map(([code, info]) => (
                      <option key={code} value={code}>
                        {code} — {info.name} ({info.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs font-body text-cream/82 pt-2 border-t border-cream/5">
                  <span>
                    1 INR = {CURRENCY_RATES[selectedCurrency]?.rate}{" "}
                    {selectedCurrency}
                  </span>
                  <span>Rates as of April 2026</span>
                </div>
              </Card>
            </motion.div>

            {/* Top 4 Currencies Grid */}
            <motion.div variants={fadeUp} custom={2}>
              <div className="grid grid-cols-2 gap-4">
                {topCurrencies.map((code) => {
                  const conv = convertCurrency(purchasePrice, code);
                  const info = CURRENCY_RATES[code];
                  return (
                    <Card key={code} className="p-5">
                      <p className="text-xs font-body text-cream/86 uppercase tracking-wider">
                        {code}
                      </p>
                      <p className="mt-2 font-display text-xl font-semibold text-gold">
                        {formatForeignCompact(conv.amount, conv.symbol)}
                      </p>
                      <p className="mt-1 text-xs font-body text-cream/82">
                        {info?.name}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ── Farmland vs Residential Comparison ─────── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-20"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-5 h-5 text-gold/60" />
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-cream">
                Farmland vs Residential
              </h2>
            </div>
            <p className="text-sm font-body text-cream/86 max-w-xl">
              Compare how your {formatPrice(purchasePrice)} investment performs
              across property types over 15 years. Farmland typically offers
              higher capital appreciation while residential plots provide
              stronger rental yields.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <Card className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData.filter((_, i) => (i + 1) % 3 === 0 || i === 0 || i === comparisonData.length - 1)}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(16,26,46,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="year"
                      stroke="rgba(16,26,46,0.15)"
                      tick={{
                        fill: "rgba(16,26,46,0.55)",
                        fontSize: 12,
                      }}
                      tickLine={false}
                      axisLine={false}
                      label={{
                        value: "Year",
                        position: "insideBottom",
                        offset: -5,
                        fill: "rgba(16,26,46,0.45)",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      stroke="rgba(16,26,46,0.15)"
                      tick={{
                        fill: "rgba(16,26,46,0.55)",
                        fontSize: 12,
                      }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => formatCompact(v)}
                      width={70}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 12,
                        fontFamily: "Outfit, sans-serif",
                      }}
                    />
                    <Bar
                      dataKey="Farmland Net Worth"
                      fill="#1E4793"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1200}
                    />
                    <Bar
                      dataKey="Residential Net Worth"
                      fill="#34d399"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison Stats */}
              <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-cream/5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TreePine className="w-4 h-4 text-gold" />
                    <span className="text-sm font-body text-gold font-medium">
                      Farmland
                    </span>
                  </div>
                  <p className="text-xs font-body text-cream/86">
                    10% appreciation, 2% rental yield
                  </p>
                  <p className="font-display text-xl font-semibold text-cream">
                    {comparisonData.length > 0
                      ? `+${comparisonData[comparisonData.length - 1]?.["Farmland ROI %"]}%`
                      : "—"}{" "}
                    <span className="text-sm text-cream/86 font-body">
                      ROI at 15Y
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-body text-emerald-400 font-medium">
                      Residential
                    </span>
                  </div>
                  <p className="text-xs font-body text-cream/86">
                    7% appreciation, 4% rental yield
                  </p>
                  <p className="font-display text-xl font-semibold text-cream">
                    {comparisonData.length > 0
                      ? `+${comparisonData[comparisonData.length - 1]?.["Residential ROI %"]}%`
                      : "—"}{" "}
                    <span className="text-sm text-cream/86 font-body">
                      ROI at 15Y
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.section>
      </section>
    </div>
  );
}
