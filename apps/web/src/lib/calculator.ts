// ─── Investment ROI Calculator ──────────────────────────

export interface EMIResult {
  emi: number;
  totalPayment: number;
  totalInterest: number;
}

export interface ROIProjection {
  year: number;
  propertyValue: number;
  cumulativeRental: number;
  cumulativeEMI: number;
  loanOutstanding: number;
  totalInvested: number;
  netWorth: number;
  roiPercent: number;
}

export interface ROIParams {
  purchasePrice: number;
  appreciationRate: number;
  rentalYield: number;
  loanAmount: number;
  interestRate: number;
  loanTenure: number;
  projectionYears: number;
}

export interface CurrencyInfo {
  rate: number;
  symbol: string;
  name: string;
}

export interface ConvertedCurrency {
  amount: number;
  rate: number;
  symbol: string;
}

// ─── Static Exchange Rates ──────────────────────────────

export const CURRENCY_RATES: Record<string, CurrencyInfo> = {
  USD: { rate: 0.012, symbol: "$", name: "US Dollar" },
  GBP: { rate: 0.0095, symbol: "£", name: "British Pound" },
  AED: { rate: 0.044, symbol: "د.إ", name: "UAE Dirham" },
  SGD: { rate: 0.016, symbol: "S$", name: "Singapore Dollar" },
  EUR: { rate: 0.011, symbol: "€", name: "Euro" },
  CAD: { rate: 0.016, symbol: "C$", name: "Canadian Dollar" },
  AUD: { rate: 0.018, symbol: "A$", name: "Australian Dollar" },
};

// ─── EMI Calculation ────────────────────────────────────

export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): EMIResult {
  if (principal <= 0 || tenureMonths <= 0) {
    return { emi: 0, totalPayment: 0, totalInterest: 0 };
  }

  if (annualRate <= 0) {
    const emi = principal / tenureMonths;
    return { emi, totalPayment: principal, totalInterest: 0 };
  }

  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  return { emi, totalPayment, totalInterest };
}

// ─── Loan Outstanding After N Months ────────────────────

function loanOutstandingAfterMonths(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  monthsPaid: number
): number {
  if (principal <= 0 || tenureMonths <= 0 || monthsPaid <= 0) return principal;
  if (monthsPaid >= tenureMonths) return 0;

  if (annualRate <= 0) {
    const monthlyPayment = principal / tenureMonths;
    return Math.max(0, principal - monthlyPayment * monthsPaid);
  }

  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);

  // Outstanding = P*(1+r)^n - EMI*((1+r)^n - 1)/r
  const compounded = principal * Math.pow(1 + monthlyRate, monthsPaid);
  const paidPortion =
    emi * ((Math.pow(1 + monthlyRate, monthsPaid) - 1) / monthlyRate);

  return Math.max(0, compounded - paidPortion);
}

// ─── ROI Projection ─────────────────────────────────────

export function calculateROI(params: ROIParams): ROIProjection[] {
  const {
    purchasePrice,
    appreciationRate,
    rentalYield,
    loanAmount,
    interestRate,
    loanTenure,
    projectionYears,
  } = params;

  const downPayment = purchasePrice - loanAmount;
  const tenureMonths = loanTenure * 12;
  const { emi } = calculateEMI(loanAmount, interestRate, tenureMonths);

  const projections: ROIProjection[] = [];

  for (let year = 1; year <= projectionYears; year++) {
    const propertyValue =
      purchasePrice * Math.pow(1 + appreciationRate / 100, year);

    // Rental income is based on current year's property value (mid-year approx)
    const avgPropertyValue =
      purchasePrice * Math.pow(1 + appreciationRate / 100, year - 0.5);
    const yearlyRental = avgPropertyValue * (rentalYield / 100);

    const cumulativeRental =
      year === 1
        ? yearlyRental
        : (projections[year - 2]?.cumulativeRental ?? 0) + yearlyRental;

    const monthsPaid = Math.min(year * 12, tenureMonths);
    const cumulativeEMI = emi * monthsPaid;

    const outstanding = loanOutstandingAfterMonths(
      loanAmount,
      interestRate,
      tenureMonths,
      monthsPaid
    );

    const totalInvested = downPayment + cumulativeEMI;
    const netWorth =
      propertyValue + cumulativeRental - totalInvested - outstanding;
    const roiPercent =
      totalInvested > 0 ? (netWorth / totalInvested) * 100 : 0;

    projections.push({
      year,
      propertyValue: Math.round(propertyValue),
      cumulativeRental: Math.round(cumulativeRental),
      cumulativeEMI: Math.round(cumulativeEMI),
      loanOutstanding: Math.round(outstanding),
      totalInvested: Math.round(totalInvested),
      netWorth: Math.round(netWorth),
      roiPercent: Math.round(roiPercent * 100) / 100,
    });
  }

  return projections;
}

// ─── Break-Even Year ────────────────────────────────────

export function calculateBreakEven(
  projections: ROIProjection[]
): number | null {
  for (const p of projections) {
    if (p.netWorth >= 0) return p.year;
  }
  return null;
}

// ─── Currency Conversion ────────────────────────────────

export function convertCurrency(
  amountINR: number,
  targetCurrency: string
): ConvertedCurrency {
  const info = CURRENCY_RATES[targetCurrency];
  if (!info) {
    return { amount: amountINR, rate: 1, symbol: "₹" };
  }
  return {
    amount: amountINR * info.rate,
    rate: info.rate,
    symbol: info.symbol,
  };
}
