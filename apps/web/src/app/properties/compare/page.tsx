"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  Check,
  X as XIcon,
  Scale,
  Loader2,
} from "lucide-react";
import { Button } from "@onyx/ui";
import {
  apiFetch,
  formatPrice,
  formatArea,
  getPropertyTypeLabel,
} from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────

interface PropertyImage {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
  order: number;
}

interface SoilData {
  soilType: string;
  ph: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  organicCarbon: number | null;
  texture: string | null;
  fertility: string | null;
  suitableCrops: string | null;
}

interface WaterData {
  waterTableDepth: number | null;
  waterQuality: string | null;
  tdsLevel: number | null;
  borewellCount: number | null;
  canalDistance: number | null;
  riverDistance: number | null;
  rainfallAvg: number | null;
}

interface LegalCheck {
  titleStatus: string;
  encumbranceCheck: boolean;
  encumbranceResult: string | null;
  litigationCheck: boolean;
  litigationResult: string | null;
}

interface CompareProperty {
  id: string;
  slug: string;
  title: string;
  type: string;
  listingType: string;
  price: number;
  pricePerUnit: number | null;
  totalArea: number;
  areaUnit: string;
  state: string;
  district: string;
  village: string | null;
  taluka: string | null;
  facing: string | null;
  roadAccess: boolean;
  roadWidth: number | null;
  boundaryWall: boolean;
  soilType: string | null;
  waterSource: string | null;
  hasClearTitle: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  images: PropertyImage[];
  soilData: SoilData | null;
  waterData: WaterData | null;
  legalCheck: LegalCheck | null;
}

// ─── Helpers ───────────────────────────────────────────────

function BoolCell({ value }: { value: boolean | null | undefined }) {
  if (value === true) {
    return <span className="text-gold font-medium">&#10003;</span>;
  }
  if (value === false) {
    return <span className="text-cream/30">&#10007;</span>;
  }
  return <span className="text-cream/20">N/A</span>;
}

function CellValue({
  value,
  highlight,
}: {
  value: string | number | null | undefined;
  highlight?: boolean;
}) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-cream/20">N/A</span>;
  }
  return (
    <span className={highlight ? "text-gold font-medium" : "text-cream"}>
      {value}
    </span>
  );
}

function findLowestPrice(properties: CompareProperty[]): string | null {
  if (properties.length === 0) return null;
  let lowest = properties[0];
  for (const p of properties) {
    if (p.price < lowest.price) lowest = p;
  }
  return lowest.id;
}

// ─── Page Component ────────────────────────────────────────

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparePageLoading />}>
      <ComparePageContent />
    </Suspense>
  );
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");
  const [properties, setProperties] = useState<CompareProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!idsParam) {
      setLoading(false);
      return;
    }

    async function fetchProperties() {
      try {
        const res = await apiFetch<{
          success: boolean;
          data: CompareProperty[];
        }>(`/properties/compare?ids=${idsParam}`);
        if (res.success) {
          setProperties(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch comparison:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, [idsParam]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Empty state
  if (!loading && (!idsParam || properties.length === 0)) {
    return (
      <div className="min-h-screen bg-onyx-950 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Scale className="w-16 h-16 text-cream/10 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-cream mb-3">
            Select Properties to Compare
          </h1>
          <p className="text-cream/40 mb-8 max-w-md mx-auto">
            Browse properties and add up to 3 to your comparison list to see
            them side by side.
          </p>
          <Link href="/properties">
            <Button>Browse Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) return <ComparePageLoading />;

  const lowestPriceId = findLowestPrice(properties);
  const hasSoilData = properties.some((p) => p.soilData);
  const hasWaterData = properties.some((p) => p.waterData);
  const hasLegalData = properties.some((p) => p.legalCheck);
  const colCount = properties.length;

  return (
    <div className="min-h-screen bg-onyx-950 pt-20 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/properties"
              className="w-10 h-10 rounded-full border border-cream/10 flex items-center justify-center text-cream/40 hover:text-cream hover:border-cream/30 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-3xl font-semibold text-cream">
                Compare Properties
              </h1>
              <p className="text-cream/30 text-sm mt-1">
                {properties.length} properties side by side
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            {copied ? "Copied!" : "Share"}
          </Button>
        </div>
      </motion.div>

      {/* Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-6"
      >
        <div className="overflow-x-auto -mx-6 px-6">
          <div
            className="min-w-[640px]"
            style={{
              display: "grid",
              gridTemplateColumns: `180px repeat(${colCount}, 1fr)`,
            }}
          >
            {/* ── HEADER ROW ── */}
            <div className="p-4" /> {/* Empty label cell */}
            {properties.map((prop, i) => (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="p-4"
              >
                <div className="rounded-xl border border-cream/8 bg-onyx-900/50 backdrop-blur-sm overflow-hidden">
                  <div className="relative h-[200px]">
                    <Image
                      src={
                        prop.images?.[0]?.url ||
                        "/images/placeholder-property.jpg"
                      }
                      alt={prop.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg font-semibold text-cream leading-tight line-clamp-1 mb-1">
                      {prop.title}
                    </h3>
                    <p className="font-display text-2xl font-semibold text-gold mb-1">
                      {formatPrice(prop.price)}
                    </p>
                    <p className="text-cream/40 text-xs">
                      {prop.district}, {prop.state}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* ── SECTION: Basic Info ── */}
            <SectionHeader
              label="Basic Info"
              colCount={colCount}
            />

            <Row label="Price" odd>
              {properties.map((p) => (
                <CellValue
                  key={p.id}
                  value={formatPrice(p.price)}
                  highlight={p.id === lowestPriceId}
                />
              ))}
            </Row>
            <Row label="Price per Unit">
              {properties.map((p) => (
                <CellValue
                  key={p.id}
                  value={
                    p.pricePerUnit
                      ? formatPrice(p.pricePerUnit)
                      : formatPrice(p.price / p.totalArea) +
                        `/${p.areaUnit}`
                  }
                />
              ))}
            </Row>
            <Row label="Total Area" odd>
              {properties.map((p) => (
                <CellValue
                  key={p.id}
                  value={formatArea(p.totalArea, p.areaUnit)}
                />
              ))}
            </Row>
            <Row label="Listing Type">
              {properties.map((p) => (
                <CellValue
                  key={p.id}
                  value={p.listingType === "SALE" ? "For Sale" : "For Lease"}
                />
              ))}
            </Row>
            <Row label="Property Type" odd>
              {properties.map((p) => (
                <CellValue key={p.id} value={getPropertyTypeLabel(p.type)} />
              ))}
            </Row>

            {/* ── SECTION: Location ── */}
            <SectionHeader label="Location" colCount={colCount} />

            <Row label="State" odd>
              {properties.map((p) => (
                <CellValue key={p.id} value={p.state} />
              ))}
            </Row>
            <Row label="District">
              {properties.map((p) => (
                <CellValue key={p.id} value={p.district} />
              ))}
            </Row>
            <Row label="Village / Taluka" odd>
              {properties.map((p) => (
                <CellValue
                  key={p.id}
                  value={
                    [p.village, p.taluka].filter(Boolean).join(", ") || null
                  }
                />
              ))}
            </Row>
            <Row label="Road Access">
              {properties.map((p) => (
                <BoolCell key={p.id} value={p.roadAccess} />
              ))}
            </Row>
            <Row label="Road Width" odd>
              {properties.map((p) => (
                <CellValue
                  key={p.id}
                  value={p.roadWidth ? `${p.roadWidth} ft` : null}
                />
              ))}
            </Row>

            {/* ── SECTION: Land Details ── */}
            <SectionHeader label="Land Details" colCount={colCount} />

            <Row label="Facing" odd>
              {properties.map((p) => (
                <CellValue key={p.id} value={p.facing} />
              ))}
            </Row>
            <Row label="Boundary Wall">
              {properties.map((p) => (
                <BoolCell key={p.id} value={p.boundaryWall} />
              ))}
            </Row>
            <Row label="Soil Type" odd>
              {properties.map((p) => (
                <CellValue key={p.id} value={p.soilType} />
              ))}
            </Row>
            <Row label="Water Source">
              {properties.map((p) => (
                <CellValue key={p.id} value={p.waterSource} />
              ))}
            </Row>

            {/* ── SECTION: Soil Data ── */}
            {hasSoilData && (
              <>
                <SectionHeader label="Soil Data" colCount={colCount} />

                <Row label="pH Level" odd>
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={p.soilData?.ph?.toString() ?? null}
                    />
                  ))}
                </Row>
                <Row label="Nitrogen">
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={
                        p.soilData?.nitrogen != null
                          ? `${p.soilData.nitrogen} kg/ha`
                          : null
                      }
                    />
                  ))}
                </Row>
                <Row label="Phosphorus" odd>
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={
                        p.soilData?.phosphorus != null
                          ? `${p.soilData.phosphorus} kg/ha`
                          : null
                      }
                    />
                  ))}
                </Row>
                <Row label="Potassium">
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={
                        p.soilData?.potassium != null
                          ? `${p.soilData.potassium} kg/ha`
                          : null
                      }
                    />
                  ))}
                </Row>
                <Row label="Organic Carbon" odd>
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={
                        p.soilData?.organicCarbon != null
                          ? `${p.soilData.organicCarbon}%`
                          : null
                      }
                    />
                  ))}
                </Row>
                <Row label="Texture">
                  {properties.map((p) => (
                    <CellValue key={p.id} value={p.soilData?.texture ?? null} />
                  ))}
                </Row>
                <Row label="Fertility" odd>
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={p.soilData?.fertility ?? null}
                      highlight={p.soilData?.fertility === "High"}
                    />
                  ))}
                </Row>
                <Row label="Suitable Crops">
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={p.soilData?.suitableCrops ?? null}
                    />
                  ))}
                </Row>
              </>
            )}

            {/* ── SECTION: Water Data ── */}
            {hasWaterData && (
              <>
                <SectionHeader label="Water Data" colCount={colCount} />

                <Row label="Water Table Depth" odd>
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={
                        p.waterData?.waterTableDepth != null
                          ? `${p.waterData.waterTableDepth} ft`
                          : null
                      }
                    />
                  ))}
                </Row>
                <Row label="Water Quality">
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={p.waterData?.waterQuality ?? null}
                      highlight={p.waterData?.waterQuality === "Good"}
                    />
                  ))}
                </Row>
                <Row label="TDS Level" odd>
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={
                        p.waterData?.tdsLevel != null
                          ? `${p.waterData.tdsLevel} ppm`
                          : null
                      }
                    />
                  ))}
                </Row>
                <Row label="Borewell Count">
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={p.waterData?.borewellCount?.toString() ?? null}
                    />
                  ))}
                </Row>
                <Row label="Canal / River Distance" odd>
                  {properties.map((p) => {
                    const parts: string[] = [];
                    if (p.waterData?.canalDistance != null)
                      parts.push(`Canal: ${p.waterData.canalDistance} km`);
                    if (p.waterData?.riverDistance != null)
                      parts.push(`River: ${p.waterData.riverDistance} km`);
                    return (
                      <CellValue
                        key={p.id}
                        value={parts.length > 0 ? parts.join(" / ") : null}
                      />
                    );
                  })}
                </Row>
                <Row label="Rainfall Average">
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={
                        p.waterData?.rainfallAvg != null
                          ? `${p.waterData.rainfallAvg} mm/yr`
                          : null
                      }
                    />
                  ))}
                </Row>
              </>
            )}

            {/* ── SECTION: Legal Status ── */}
            {hasLegalData && (
              <>
                <SectionHeader label="Legal Status" colCount={colCount} />

                <Row label="Title Status" odd>
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={p.legalCheck?.titleStatus ?? null}
                      highlight={p.legalCheck?.titleStatus === "clear"}
                    />
                  ))}
                </Row>
                <Row label="Clear Title">
                  {properties.map((p) => (
                    <BoolCell key={p.id} value={p.hasClearTitle} />
                  ))}
                </Row>
                <Row label="Dispute Free" odd>
                  {properties.map((p) => (
                    <BoolCell
                      key={p.id}
                      value={
                        p.legalCheck
                          ? p.legalCheck.litigationResult === "none"
                          : undefined
                      }
                    />
                  ))}
                </Row>
                <Row label="Encumbrance Check">
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={p.legalCheck?.encumbranceResult ?? null}
                    />
                  ))}
                </Row>
                <Row label="Litigation Check" odd>
                  {properties.map((p) => (
                    <CellValue
                      key={p.id}
                      value={p.legalCheck?.litigationResult ?? null}
                    />
                  ))}
                </Row>
              </>
            )}

            {/* ── SECTION: Metadata ── */}
            <SectionHeader label="Metadata" colCount={colCount} />

            <Row label="View Count" odd>
              {properties.map((p) => (
                <CellValue key={p.id} value={p.viewCount.toLocaleString()} />
              ))}
            </Row>
            <Row label="Featured">
              {properties.map((p) => (
                <BoolCell key={p.id} value={p.isFeatured} />
              ))}
            </Row>
            <Row label="Listed Date" odd>
              {properties.map((p) => (
                <CellValue
                  key={p.id}
                  value={new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                />
              ))}
            </Row>

            {/* ── View Property buttons ── */}
            <div className="p-4" />
            {properties.map((prop) => (
              <div key={prop.id} className="p-4">
                <Link href={`/properties/${prop.slug}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Property
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ComparePageLoading() {
  return (
    <div className="min-h-screen bg-onyx-950 pt-20 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gold animate-spin" />
    </div>
  );
}

// ─── Table Sub-components ──────────────────────────────────

function SectionHeader({
  label,
  colCount,
}: {
  label: string;
  colCount: number;
}) {
  return (
    <>
      <div
        className="col-span-full mt-6 mb-1 px-4 py-3 border-b border-gold/20"
        style={{ gridColumn: `1 / span ${colCount + 1}` }}
      >
        <h3 className="font-display text-lg font-semibold text-gold">
          {label}
        </h3>
      </div>
    </>
  );
}

function Row({
  label,
  odd,
  children,
}: {
  label: string;
  odd?: boolean;
  children: React.ReactNode;
}) {
  const bgClass = odd ? "bg-onyx-900/30" : "bg-onyx-900/50";
  const childArray = Array.isArray(children) ? children : [children];

  return (
    <>
      {/* Sticky label cell */}
      <div
        className={`${bgClass} px-4 py-3 text-sm text-cream/40 font-medium sticky left-0 z-10 border-r border-cream/5`}
      >
        {label}
      </div>
      {/* Value cells */}
      {childArray.map((child, i) => (
        <div key={i} className={`${bgClass} px-4 py-3 text-sm`}>
          {child}
        </div>
      ))}
    </>
  );
}
