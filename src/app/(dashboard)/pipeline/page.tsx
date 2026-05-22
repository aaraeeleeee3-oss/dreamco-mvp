"use client"

import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { DndContext, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Lead } from "@/types"

const COLUMNS = [
  { id: "new", label: "New", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
  { id: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" },
  { id: "qualified", label: "Qualified", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" },
  { id: "booked", label: "Booked", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100" },
  { id: "won", label: "Won", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
  { id: "lost", label: "Lost", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
]

function SortableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { lead },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <p className="font-medium text-sm truncate">
        {lead.first_name} {lead.last_name}
      </p>
      {lead.company && (
        <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
      )}
      {lead.email && (
        <p className="text-xs text-muted-foreground truncate mt-1">{lead.email}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className="text-xs">
          Score: {lead.score}
        </Badge>
        <Badge variant="secondary" className="text-xs capitalize">
          {lead.source}
        </Badge>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [activeLead, setActiveLead] = useState<Lead | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const { data: leads, isLoading } = useQuery({
    queryKey: ["pipeline-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false })
      return (data || []) as Lead[]
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] })
      toast.success("Lead moved!")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleDragStart = useCallback((event: any) => {
    const { active } = event
    setActiveLead(active.data.current?.lead || null)
  }, [])

  const handleDragEnd = useCallback((event: any) => {
    setActiveLead(null)
    const { active, over } = event
    if (!over) return

    const leadId = active.id as string
    const columnId = over.id as string

    // Check if dropping on a column (status) or another card
    const targetColumn = COLUMNS.find((c) => c.id === over.id)
    if (targetColumn) {
      updateStatus.mutate({ id: leadId, status: targetColumn.id })
    }
  }, [updateStatus])

  const getLeadsByStatus = (status: string) =>
    leads?.filter((l) => l.status === status) || []

  if (isLoading) return <div className="flex justify-center py-12">Loading pipeline...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline</h1>
        <p className="text-muted-foreground">Drag leads between stages to update their status</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)` }}>
          {COLUMNS.map((column) => {
            const columnLeads = getLeadsByStatus(column.id)
            return (
              <Card key={column.id} className="min-h-[300px]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{column.label}</CardTitle>
                    <Badge variant="outline">{columnLeads.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[200px]">
                  <SortableContext
                    items={columnLeads.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnLeads.map((lead) => (
                      <SortableLeadCard key={lead.id} lead={lead} />
                    ))}
                  </SortableContext>
                  {columnLeads.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                      Drop leads here
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rounded-lg border bg-card p-3 shadow-lg">
              <p className="font-medium text-sm">
                {activeLead.first_name} {activeLead.last_name}
              </p>
              {activeLead.company && (
                <p className="text-xs text-muted-foreground">{activeLead.company}</p>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}