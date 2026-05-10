"use client";

import { Scale } from "lucide-react";
import { Button } from "@onyx/ui";
import { useComparison } from "./comparison-provider";

interface CompareButtonProps {
  propertyId: string;
  variant?: "card" | "detail";
}

export function CompareButton({ propertyId, variant = "card" }: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isCompared, canAddMore } = useComparison();
  const compared = isCompared(propertyId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (compared) {
      removeFromCompare(propertyId);
    } else if (canAddMore) {
      addToCompare(propertyId);
    }
  };

  if (variant === "card") {
    return (
      <button
        onClick={handleClick}
        disabled={!compared && !canAddMore}
        title={
          compared
            ? "Remove from comparison"
            : canAddMore
              ? "Add to comparison"
              : "Maximum 3 properties selected"
        }
        className={`
          w-8 h-8 rounded-full flex items-center justify-center
          backdrop-blur-sm border transition-all duration-200
          ${
            compared
              ? "bg-gold/20 border-gold text-gold shadow-lg shadow-gold/20"
              : canAddMore
                ? "bg-onyx-950/60 border-cream/10 text-cream/50 hover:text-gold hover:border-gold/40 hover:bg-gold/10"
                : "bg-onyx-950/60 border-cream/5 text-cream/20 cursor-not-allowed"
          }
        `}
      >
        <Scale className="w-3.5 h-3.5" />
      </button>
    );
  }

  // variant === "detail"
  return (
    <Button
      onClick={handleClick}
      disabled={!compared && !canAddMore}
      variant={compared ? "default" : "outline"}
      size="sm"
      className="w-full"
    >
      <Scale className="w-4 h-4" />
      {compared ? "Remove from Compare" : canAddMore ? "Add to Compare" : "Compare Full (3/3)"}
    </Button>
  );
}
