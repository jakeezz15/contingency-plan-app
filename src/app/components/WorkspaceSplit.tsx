"use client";

import type { ReactNode } from "react";

type WorkspaceSplitProps = {
  workspace: ReactNode;
  map: ReactNode;
};

export default function WorkspaceSplit({ workspace, map }: WorkspaceSplitProps) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:grid lg:h-[calc(100vh-3.5rem)] lg:min-h-0 lg:grid-cols-[minmax(340px,400px)_minmax(0,1fr)] lg:items-stretch">
      <div className="relative z-20 flex max-h-[min(72vh,42rem)] min-h-0 flex-col overflow-hidden border-gray-200 bg-white lg:max-h-none lg:border-r">
        {workspace}
      </div>

      <div className="relative z-0 min-h-0 overflow-hidden border-t border-gray-200 bg-gray-50 lg:border-t-0">
        <div className="h-[min(50vh,26rem)] w-full sm:h-[min(55vh,30rem)] lg:h-full">
          {map}
        </div>
      </div>
    </div>
  );
}
