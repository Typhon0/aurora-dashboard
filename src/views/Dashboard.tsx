import {
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useHass } from "@hakit/core";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { Button } from "../components/ui/button";
import { Pencil, Check, CarFront, X } from "lucide-react";
import { cn } from "../lib/utils";

import GridLayout, { useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Layout Data & Components
import { initialLayout, type RGLItem } from "./dashboard-layout";
import { CardRenderer } from "../components/aurora/CardRenderer";
import { AuroraFabCard } from "../components/aurora/AuroraFabCard";
import { AuroraCarView } from "../components/aurora/AuroraCarView";
import { AnimatePresence } from "motion/react";

const STORAGE_KEY = "aurora-dashboard-layout-v4-granular";

export function Dashboard() {
  const hass = useHass() as any;
  const [isEditMode, setIsEditMode] = useState(false);
  const [layoutItems, setLayoutItems] = useState<RGLItem[]>([]);
  const [view, setView] = useState<"dashboard" | "car">(
    "dashboard",
  );

  // Check entity existence
  const exists = useCallback(
    (id?: string) => {
      if (!id) return true;
      if (hass?.getEntity) return !!hass.getEntity(id);
      const containers = [
        hass?.getAllEntities?.(),
        hass?.entities,
        hass?.states,
        hass?.__ENTITIES__,
      ];
      for (const c of containers) {
        if (c && typeof c === "object" && id in c) return true;
      }
      return false;
    },
    [hass],
  );

  const {
    width,
    containerRef,
    // mounted, // Optional: useful if we want to show loading state
  } = useContainerWidth();

  // Initialize Items
  useEffect(() => {
    if (!hass) return;
    if (layoutItems.length > 0) return;

    const savedLayout = localStorage.getItem(STORAGE_KEY);

    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        const validItems = parsed.filter(
          (i: RGLItem) =>
            i.type === "header" ||
            !i.entityId ||
            exists(i.entityId),
        );
        setLayoutItems(validItems);
        return;
      } catch (e) {
        console.error("Failed to load saved layout:", e);
      }
    }

    const validItems = initialLayout.filter(
      (i) =>
        i.type === "header" ||
        !i.entityId ||
        exists(i.entityId),
    );
    setLayoutItems(validItems);
  }, [hass, exists, layoutItems.length]);

  // Convert to RGL format
  const layout = useMemo(() => {
    return layoutItems.map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW || 1,
      minH: item.minH || 1,
    }));
  }, [layoutItems]);

  // Simple layout change
  const onLayoutChange = (newLayout: any[]) => {
    if (!isEditMode) return;

    const updatedItems = layoutItems.map((item) => {
      const newPos = newLayout.find((l: any) => l.i === item.i);
      if (newPos) {
        return {
          ...item,
          x: newPos.x,
          y: newPos.y,
          w: newPos.w,
          h: newPos.h,
        };
      }
      return item;
    });

    setLayoutItems(updatedItems);
  };

  // Save layout
  const saveLayout = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(layoutItems),
      );
      console.log("✅ Layout saved");
    } catch (e) {
      console.error("Failed to save layout:", e);
    }
  };

  // Reset layout
  const resetLayout = () => {
    const validItems = initialLayout.filter(
      (i) =>
        i.type === "header" ||
        !i.entityId ||
        exists(i.entityId),
    );
    setLayoutItems(validItems);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setLayoutItems((prev) =>
      prev.filter((i) => i.i !== itemId),
    );
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditMode) {
      saveLayout();
    }
    setIsEditMode(!isEditMode);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 pb-20">
      {/* Background Aurora */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[128px] opacity-40 mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[128px] opacity-40 mix-blend-screen animate-pulse-slow delay-75" />
      </div>

      <div className="relative z-10 p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-thin tracking-tight text-white/90">
              Aurora{" "}
              <span className="font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-white/40 mt-2 font-light tracking-wide">
              Home Automation • iOS 26 Glassmorphism
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("car")}
              className="gap-2 text-white/60 hover:text-white hover:bg-white/10"
            >
              <CarFront className="w-4 h-4" />
              <span className="hidden sm:inline">My Car</span>
            </Button>

            {isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetLayout}
                className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Reset
              </Button>
            )}

            <Button
              variant={isEditMode ? "default" : "ghost"}
              size="sm"
              onClick={toggleEditMode}
              className={cn(
                "gap-2 transition-all",
                isEditMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10",
              )}
            >
              {isEditMode ? (
                <Check className="w-4 h-4" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              {isEditMode ? "Done" : "Edit"}
            </Button>

            <div className="bg-white/5 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-white/60 font-medium">
                System Online
              </span>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Edit Mode Banner */}
        {isEditMode && (
          <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <p className="text-white/80 text-sm">
                <strong>Mode Édition Actif:</strong> Glissez les
                cartes pour les réorganiser.
              </p>
            </div>
          </div>
        )}

        {/* Grid Layout Container */}
        <div
          ref={containerRef as any}
          className={cn(
            "transition-all duration-500 rounded-[2rem]",
            isEditMode && "bg-white/5 ring-1 ring-white/10 p-4",
          )}
          style={{
            backgroundImage: isEditMode
              ? "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)"
              : "none",
            backgroundSize: "24px 24px",
          }}
        >
          <GridLayout
            className="layout"
            width={width}
            layout={layout}
            gridConfig={{
              cols: 5,
              rowHeight: 110,
              margin: [20, 20],
              containerPadding: [0, 0],
            }}
            dragConfig={{
              enabled: isEditMode,
              handle: ".drag-handle",
            }}
            resizeConfig={{
              enabled: false,
            }}
            compactType="vertical"
            preventCollision={false}
            onLayoutChange={onLayoutChange as any}
          >
            {layoutItems.map((item) => (
              <div
                key={item.i}
                className={cn(
                  "transition-all duration-200",
                  isEditMode &&
                  "hover:ring-2 hover:ring-blue-400/50",
                )}
              >
                <div className="h-full w-full relative">
                  {isEditMode && (
                    <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-[1.75rem] pointer-events-none z-40" />
                  )}

                  {isEditMode && (
                    <div className="drag-handle absolute top-2 left-2 w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-50 hover:bg-white/20 transition-all">
                      <svg
                        className="w-4 h-4 text-white/60"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="9"
                          cy="7"
                          r="1.5"
                          fill="currentColor"
                        />
                        <circle
                          cx="15"
                          cy="7"
                          r="1.5"
                          fill="currentColor"
                        />
                        <circle
                          cx="9"
                          cy="12"
                          r="1.5"
                          fill="currentColor"
                        />
                        <circle
                          cx="15"
                          cy="12"
                          r="1.5"
                          fill="currentColor"
                        />
                        <circle
                          cx="9"
                          cy="17"
                          r="1.5"
                          fill="currentColor"
                        />
                        <circle
                          cx="15"
                          cy="17"
                          r="1.5"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  )}

                  <div
                    className={cn(
                      "h-full w-full",
                      isEditMode && "pointer-events-none",
                    )}
                  >
                    <CardRenderer
                      item={item}
                      isEditMode={isEditMode}
                    />
                  </div>

                  {isEditMode && item.type !== "header" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.i);
                      }}
                      className="nodrag absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg z-50 transition-all active:scale-90"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </GridLayout>
        </div>

        <AuroraFabCard
          domain="script"
          target="script.home_arrive"
        />
      </div>

      <AnimatePresence>
        {view === "car" && (
          <AuroraCarView onClose={() => setView("dashboard")} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-75 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}