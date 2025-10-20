"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ScoreBadge } from "./score-badge";

interface ProspectCardProps {
  prospect: {
    id: string;
    domain: string;
    companyName?: string;
    score: number;
    fitLevel: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
    reasoning: string;
    matchedCriteria: any;
    gaps: any;
    status: string;
  };
}

export function ProspectCard({ prospect }: ProspectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const matchedCriteria = Array.isArray(prospect.matchedCriteria)
    ? prospect.matchedCriteria
    : typeof prospect.matchedCriteria === "object"
    ? Object.entries(prospect.matchedCriteria).map(([key, value]) => ({ key, value }))
    : [];

  const gaps = Array.isArray(prospect.gaps)
    ? prospect.gaps
    : typeof prospect.gaps === "object"
    ? Object.entries(prospect.gaps).map(([key, value]) => ({ key, value }))
    : [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {prospect.companyName || prospect.domain}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <a
                href={`https://${prospect.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                {prospect.domain}
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </div>
          <ScoreBadge score={prospect.score} fitLevel={prospect.fitLevel} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Reasoning */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Analysis</h4>
            <p className="text-sm text-muted-foreground">{prospect.reasoning}</p>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show Details
              </>
            )}
          </Button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-4 pt-4 border-t">
              {/* Matched Criteria */}
              {matchedCriteria.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-green-600">
                    Matched Criteria
                  </h4>
                  <div className="space-y-2">
                    {matchedCriteria.map((item: any, index: number) => (
                      <div key={index} className="text-sm">
                        <Badge variant="outline" className="bg-green-50">
                          {typeof item === "string"
                            ? item
                            : item.key || JSON.stringify(item)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {gaps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-orange-600">Gaps</h4>
                  <div className="space-y-2">
                    {gaps.map((item: any, index: number) => (
                      <div key={index} className="text-sm">
                        <Badge variant="outline" className="bg-orange-50">
                          {typeof item === "string"
                            ? item
                            : item.key || JSON.stringify(item)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
