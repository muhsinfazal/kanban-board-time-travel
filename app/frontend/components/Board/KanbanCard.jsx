import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PencilIcon, TrashIcon } from "../Icon";

export default function KanbanCard({ card, isHistorical, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: card.id, disabled: isHistorical });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-zinc-800/80 border border-zinc-700/60 rounded-xl p-3.5 
        ${!isHistorical ? "cursor-grab active:cursor-grabbing hover:border-zinc-500/80 hover:bg-zinc-800" : "cursor-default"}
        transition-all duration-150 select-none`}
      {...(isHistorical ? {} : { ...attributes, ...listeners })}
    >
      <p className="text-sm font-medium text-zinc-100 leading-snug pr-6">
        {card.title}
      </p>
      {card.description && (
        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
          {card.description}
        </p>
      )}
      {!isHistorical && (
        <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            title="Edit"
          >
            <PencilIcon />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export function CardOverlay({ card }) {
  return (
    <div className="bg-zinc-800 border border-zinc-500 rounded-xl p-3.5 shadow-2xl rotate-2 w-64">
      <p className="text-sm font-medium text-zinc-100">{card.title}</p>
      {card.description && (
        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
          {card.description}
        </p>
      )}
    </div>
  );
}
