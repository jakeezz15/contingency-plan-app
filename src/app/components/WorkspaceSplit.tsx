"use client";

import type { ReactNode } from "react";

type WorkspaceSplitProps = {
  workspace: ReactNode;
  map: ReactNode;
};

export default function WorkspaceSplit({ workspace, map }: WorkspaceSplitProps) {
  return (
    <>
      <div className="lg:hidden">
        {map}
        {workspace}
      </div>

      <div className="hidden lg:grid lg:grid-cols-5 lg:items-start lg:gap-6">
        <div className="lg:sticky  lg:col-span-2 lg:max-h-[calc(100vh-10rem)] lg:self-start">
          <div className="overflow-y-auto overscroll-y-contain rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:max-h-[calc(100vh-10rem)]">
            {workspace}
          </div>
        </div>

        <div className="relative isolate z-0 lg:sticky lg:top-40 lg:col-span-3 lg:self-start">
          {map}
        </div>
      </div>
    </>
  );
}
