import React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import KanbanCard from "./KanbanCard";
import { COLUMN_ACCENT, COLUMN_LABELS, COLUMN_DOT } from "./constants";

export default function KanbanColumn({
  colKey,
  cards,
  isHistorical,
  onAddCard,
  onEditCard,
  onDeleteCard
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colKey });

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div
        className={`flex items-center gap-2.5 mb-3 pb-3 border-b ${COLUMN_ACCENT[colKey]}`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${COLUMN_DOT[colKey]}`}
        />
        <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
          {COLUMN_LABELS[colKey]}
        </span>
        <span className="ml-auto text-xs text-zinc-500 font-mono tabular-nums">
          {cards.length}
        </span>
      </div>

      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 flex-1 min-h-[60px] rounded-lg transition-colors duration-150
            ${isOver && cards.length === 0 ? "bg-zinc-800/50 border border-dashed border-zinc-600" : ""}`}
        >
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              isHistorical={isHistorical}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}
        </div>
      </SortableContext>

      {!isHistorical && (
        <button
          onClick={() => onAddCard(colKey)}
          className="mt-3 flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 py-2 px-1 rounded-lg hover:bg-zinc-800/60 transition-colors w-full"
        >
          <span className="text-base leading-none">+</span>
          Add card
        </button>
      )}
    </div>
  );
}
