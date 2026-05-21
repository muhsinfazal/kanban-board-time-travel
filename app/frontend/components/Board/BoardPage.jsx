import React, { useState } from "react";
import axios from "axios";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import { CardOverlay } from "./KanbanCard";
import CardModal from "./CardModal";
import TimelineBar from "./TimelineBar";
import ActivityLog from "./ActivityLog";
import { BoardIcon } from "../Icon";

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content;
}

axios.defaults.headers.common["X-CSRF-Token"] = csrfToken();

export default function BoardPage({
  columns,
  board: initialBoard,
  events: initialEvents,
  timeline
}) {
  const [board, setBoard] = useState(initialBoard);
  const [events, setEvents] = useState(initialEvents);
  const [hasMoreEvents, setHasMoreEvents] = useState(initialEvents.length === 25);
  const [isLoadingMoreEvents, setIsLoadingMoreEvents] = useState(false);
  const [isHistorical, setIsHistorical] = useState(false);
  const [historicalTime, setHistoricalTime] = useState(null);
  const [modal, setModal] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findColumn = (cardId) => {
    return columns.find((col) => board[col]?.some((c) => c.id === cardId));
  };

  const refreshEvents = async () => {
    try {
      const { data } = await axios.get("/activity");
      if (data?.events) setEvents(data.events);
      if (typeof data?.has_more === "boolean") setHasMoreEvents(data.has_more);
    } catch (err) {
      console.error("Failed to refresh activity log", err);
    }
  };

  const loadMoreEvents = async () => {
    if (isHistorical || isLoadingMoreEvents || !hasMoreEvents) return;
    const oldestEvent = events[events.length - 1];
    if (!oldestEvent) return;

    setIsLoadingMoreEvents(true);
    try {
      const { data } = await axios.get("/activity", {
        params: {
          before_occurred_at: oldestEvent.occurred_at,
          before_id: oldestEvent.id
        }
      });

      if (data?.events?.length) {
        setEvents((prev) => [...prev, ...data.events]);
      }
      setHasMoreEvents(data?.has_more ?? false);
    } catch (err) {
      console.error("Failed to load more activity", err);
    } finally {
      setIsLoadingMoreEvents(false);
    }
  };

  const handleDragStart = ({ active }) => {
    const col = findColumn(active.id);
    const card = col ? board[col].find((c) => c.id === active.id) : null;
    setActiveCard(card);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeCol = findColumn(active.id);
    const overCol = columns.find(
      (col) => col === over.id || board[col]?.some((c) => c.id === over.id)
    );
    if (!activeCol || !overCol || activeCol === overCol) return;

    setBoard((prev) => {
      const newBoard = { ...prev };
      const activeCards = [...newBoard[activeCol]];
      const overCards = [...newBoard[overCol]];
      const cardIdx = activeCards.findIndex((c) => c.id === active.id);
      const [moved] = activeCards.splice(cardIdx, 1);
      moved.column_name = overCol;
      overCards.push(moved);
      newBoard[activeCol] = activeCards;
      newBoard[overCol] = overCards;
      return newBoard;
    });
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveCard(null);
    if (!over) return;

    const overCol = columns.find(
      (col) => col === over.id || board[col]?.some((c) => c.id === over.id)
    );
    if (!overCol) return;

    const colCards = board[overCol];
    const activeIdx = colCards.findIndex((c) => c.id === active.id);
    const overIdx = colCards.findIndex((c) => c.id === over.id);

    let finalCards = colCards;
    if (activeIdx !== overIdx && overIdx !== -1) {
      finalCards = arrayMove(colCards, activeIdx, overIdx);
      setBoard((prev) => ({ ...prev, [overCol]: finalCards }));
    }

    const idx = finalCards.findIndex((c) => c.id === active.id);
    const beforeCard = finalCards[idx - 1] || null;
    const afterCard = finalCards[idx + 1] || null;

    try {
      await axios.patch(`/cards/${active.id}/move`, {
        column_name: overCol,
        before_id: beforeCard?.id,
        after_id: afterCard?.id
      });
      await refreshEvents();
    } catch (err) {
      console.error("Move failed", err);
    }
  };

  const handleCreateCard = async ({ title, description }) => {
    const { data } = await axios.post("/cards", {
      card: { title, description, column_name: modal.column }
    });
    setBoard((prev) => ({
      ...prev,
      [modal.column]: [...prev[modal.column], data.card]
    }));
    await refreshEvents();
    setModal(null);
  };

  const handleEditCard = async ({ title, description }) => {
    const { data } = await axios.patch(`/cards/${modal.card.id}`, {
      card: { title, description }
    });
    setBoard((prev) => {
      const col = findColumn(modal.card.id);
      if (!col) return prev;
      return {
        ...prev,
        [col]: prev[col].map((c) => (c.id === modal.card.id ? data.card : c))
      };
    });
    await refreshEvents();
    setModal(null);
  };

  const handleDeleteCard = async (cardId) => {
    const col = findColumn(cardId);
    if (!col) return;
    await axios.delete(`/cards/${cardId}`);
    setBoard((prev) => ({
      ...prev,
      [col]: prev[col].filter((c) => c.id !== cardId)
    }));
    await refreshEvents();
  };

  const handleScrub = async (isoTimestamp) => {
    setLoading(true);
    try {
      const { data } = await axios.get("/timeline", {
        params: { at: isoTimestamp }
      });
      setBoard(data.board);
      setEvents(data.events);
      setIsHistorical(true);
      setHistoricalTime(isoTimestamp);
    } catch (err) {
      console.error("Timeline scrub failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = () => {
    setBoard(initialBoard);
    setEvents(initialEvents);
    setHasMoreEvents(initialEvents.length === 25);
    setIsLoadingMoreEvents(false);
    setIsHistorical(false);
    setHistoricalTime(null);
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 font-sans">
      <header className="shrink-0 border-b border-zinc-800/80 px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center">
            <BoardIcon className="w-4 h-4 text-zinc-900" />
          </div>
          <h1 className="font-semibold text-zinc-100 tracking-tight">
            Kanban Board
          </h1>
        </div>
        {isHistorical && (
          <div className="flex items-center gap-1.5 bg-amber-950/50 border border-amber-800/50 text-amber-300 text-xs font-medium px-3 py-1 rounded-full">
            Historical View - Read-only
          </div>
        )}
        {loading && (
          <div className="ml-auto text-xs text-zinc-500 flex items-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
            Loading…
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div className="p-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6">
                {columns.map((col) => (
                  <KanbanColumn
                    key={col}
                    colKey={col}
                    cards={board[col] || []}
                    isHistorical={isHistorical}
                    onAddCard={(column) => setModal({ mode: "create", column })}
                    onEditCard={(card) => setModal({ mode: "edit", card })}
                    onDeleteCard={handleDeleteCard}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeCard ? <CardOverlay card={activeCard} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        <ActivityLog
          events={events}
          onLoadMore={loadMoreEvents}
          hasMore={hasMoreEvents}
          loadingMore={isLoadingMoreEvents}
        />
      </div>

      <TimelineBar
        timeline={timeline}
        isHistorical={isHistorical}
        historicalTime={historicalTime}
        onScrub={handleScrub}
        onReturn={handleReturn}
      />

      {modal && !isHistorical && (
        <CardModal
          card={modal.mode === "edit" ? modal.card : null}
          defaultColumn={modal.column}
          onClose={() => setModal(null)}
          onSave={modal.mode === "edit" ? handleEditCard : handleCreateCard}
        />
      )}
    </div>
  );
}
