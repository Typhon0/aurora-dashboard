import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { CardRenderer, DashboardItem } from './CardRenderer';
import { cn } from '../../lib/utils';

interface Props {
  item: DashboardItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  isEditMode: boolean;
  dragType?: string;
}

export const DraggableItem = ({ item, index, moveItem, isEditMode, dragType = 'CARD' }: Props) => {
    const ref = useRef<HTMLDivElement>(null);

    const [{ isDragging }, drag] = useDrag({
        type: dragType,
        item: { index },
        canDrag: isEditMode,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: dragType,
        hover(draggedItem: { index: number }, monitor) {
            if (!ref.current) return;
            const dragIndex = draggedItem.index;
            const hoverIndex = index;
            
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) return;
            
            // Determine rectangle on screen
            // (Optional: Refined logic to only swap when crossing 50% threshold)
            // For a grid, simple swap on hover is usually sufficient for v1

            // Time to actually perform the action
            moveItem(dragIndex, hoverIndex);
            
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            draggedItem.index = hoverIndex;
        },
    });

    if (isEditMode) {
        drag(drop(ref));
    }

    // Calculate Grid Classes safely
    const getColSpan = (span?: number) => {
        if (span === 2) return "col-span-2"; // Wide
        if (span === 4) return "col-span-4"; // Full Section
        if (span === 5) return "col-span-5"; // Full Row
        return "col-span-1"; // Standard
    };

    const getRowSpan = (span?: number) => {
        if (span === 2) return "row-span-2"; // Tall
        return "row-span-1";
    };

    const gridClasses = cn(
        getColSpan(item.colSpan),
        getRowSpan(item.rowSpan),
        "relative transition-all duration-300"
    );

    return (
        <div
            ref={ref}
            className={cn(
                gridClasses,
                isDragging && "opacity-50 grayscale scale-95 z-50", // Drag visual
                isEditMode && "cursor-grab active:cursor-grabbing",
                // Edit Mode "Grid" visual: Dashed border around the slot
                isEditMode && !isDragging && "ring-2 ring-white/10 ring-dashed rounded-[1.75rem]" 
            )}
            style={{ 
                transform: isEditMode && !isDragging ? `rotate(${Math.random() * 0.5 - 0.25}deg)` : undefined
            }}
        >
             {/* In edit mode, disable pointer events on the card content so we can drag easily */}
             <div className={cn("h-full w-full", isEditMode && "pointer-events-none")}>
                <CardRenderer item={item} isEditMode={isEditMode} />
             </div>
             
             {/* Delete Button (Optional for future) */}
             {isEditMode && (
                 <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg opacity-80 hover:opacity-100 cursor-pointer animate-in fade-in zoom-in">
                     <div className="w-3 h-0.5 bg-white rounded-full" />
                 </div>
             )}
        </div>
    );
};
