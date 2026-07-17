"use client";

import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "../../../src/components/ui";

export default function GalleryPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900">Gallery</h1>
        <p className="text-xs text-slate-500">
          Classroom scan media and verification images will be available here.
        </p>
      </div>

      {/* Elegant Empty State */}
      <Card className="border border-dashed border-slate-200 bg-white overflow-hidden shadow-xs">
        <CardContent className="p-12 py-20 flex flex-col items-center justify-center text-center">
          <div className="mx-auto w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mb-4">
            <ImageIcon className="h-6 w-6" />
          </div>

          <h2 className="text-sm font-semibold text-slate-800 mb-1">
            Gallery is not available yet.
          </h2>
          <p className="text-xs text-slate-400 max-w-xs">
            Classroom scan media will appear here when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
