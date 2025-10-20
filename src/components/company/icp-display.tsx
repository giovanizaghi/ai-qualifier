"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Globe, DollarSign, Target } from "lucide-react";

interface ICPDisplayProps {
  icp: {
    id: string;
    title: string;
    description: string;
    buyerPersonas: any;
    companySize: any;
    industries: string[];
    geographicRegions: string[];
    fundingStages: string[];
  };
  company?: {
    name?: string;
    domain: string;
    description?: string;
  };
}

export function ICPDisplay({ icp, company }: ICPDisplayProps) {
  const buyerPersonas = Array.isArray(icp.buyerPersonas) ? icp.buyerPersonas : [];
  const companySize = typeof icp.companySize === "object" ? icp.companySize : {};

  return (
    <div className="space-y-6">
      {/* Company Info */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {company.name || company.domain}
            </CardTitle>
            {company.description && (
              <CardDescription>{company.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <strong>Domain:</strong> {company.domain}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ICP Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {icp.title}
          </CardTitle>
          <CardDescription>{icp.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Buyer Personas */}
      {buyerPersonas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Buyer Personas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {buyerPersonas.map((persona: any, index: number) => (
                <div key={index} className="border-l-2 border-blue-500 pl-4">
                  <h4 className="font-semibold">{persona.role || persona.title}</h4>
                  {persona.painPoints && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {Array.isArray(persona.painPoints)
                        ? persona.painPoints.join(", ")
                        : persona.painPoints}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Size */}
      {(companySize.minEmployees || companySize.maxEmployees) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Company Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {companySize.minEmployees && (
                <div className="text-sm">
                  <strong>Min Employees:</strong> {companySize.minEmployees}
                </div>
              )}
              {companySize.maxEmployees && (
                <div className="text-sm">
                  <strong>Max Employees:</strong> {companySize.maxEmployees}
                </div>
              )}
              {companySize.revenueRange && (
                <div className="text-sm">
                  <strong>Revenue Range:</strong> {companySize.revenueRange}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Industries */}
      {icp.industries && icp.industries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              Target Industries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {icp.industries.map((industry: string) => (
                <Badge key={industry} variant="secondary">
                  {industry}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geographic Regions */}
      {icp.geographicRegions && icp.geographicRegions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-500" />
              Geographic Regions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {icp.geographicRegions.map((region: string) => (
                <Badge key={region} variant="outline">
                  {region}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funding Stages */}
      {icp.fundingStages && icp.fundingStages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Funding Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {icp.fundingStages.map((stage: string) => (
                <Badge key={stage} variant="default">
                  {stage}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
