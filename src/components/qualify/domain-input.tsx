"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DomainInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DomainInput({ value, onChange, placeholder, disabled }: DomainInputProps) {
  const domains = value.split("\n").filter((d) => d.trim());
  const domainCount = domains.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Prospect Domains
        </CardTitle>
        <CardDescription>
          Enter prospect company domains, one per line (e.g., example.com)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domains">Domains</Label>
            <Textarea
              id="domains"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || "example1.com\nexample2.com\nexample3.com"}
              disabled={disabled}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {domainCount > 0 ? (
              <span>
                {domainCount} domain{domainCount !== 1 ? "s" : ""} entered
              </span>
            ) : (
              <span>No domains entered yet</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
