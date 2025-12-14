import { cn } from "../../lib/utils";
import { GripVertical } from "lucide-react";
import { useRef, useState } from "react";

interface DraggableCardProps {
  id: string;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
  isEditMode: boolean;
  className?: string;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  id,
  index,
  moveCard,
  children,
  isEditMode,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const dragItemRef = useRef<{
    id: string;
    index: number;
  } | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditMode) return;

    setIsDragging(true);
    dragItemRef.current = { id, index };

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", id);

    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsOver(false);
    dragItemRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!dragItemRef.current) return;

    const dragIndex = dragItemRef.current.index;
    const hoverIndex = index;

    if (dragIndex === hoverIndex) return;

    moveCard(dragIndex, hoverIndex);
    dragItemRef.current.index = hoverIndex;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    if (!isEditMode) return;
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    setIsOver(false);
  };

  return (
    <div
      draggable={isEditMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative transition-all duration-200 h-full", // ✅ Added h-full
        isDragging && "opacity-50 scale-95",
        isOver && isEditMode && "scale-105",
        className,
      )}
      style={{
        // ✅ Critical: Ensure grid placement is respected
        display: "grid",
        placeItems: "stretch",
      }}
    >
      {isEditMode && (
        <div
          className="absolute -top-2 -left-2 z-50 cursor-grab active:cursor-grabbing bg-white/20 backdrop-blur-md rounded-lg p-1.5 hover:bg-white/30 transition-colors border border-white/20"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="h-full w-full">
        {" "}
        {/* ✅ Wrapper to contain children */}
        {children}
      </div>
    </div>
  );
};