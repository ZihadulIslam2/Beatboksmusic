import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function reorderItemsById<T extends { _id: string }>(
  items: T[],
  sourceId: string,
  targetId: string,
) {
  const sourceIndex = items.findIndex((item) => item._id === sourceId)
  const targetIndex = items.findIndex((item) => item._id === targetId)

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return items
  }

  const nextItems = [...items]
  const [movedItem] = nextItems.splice(sourceIndex, 1)

  nextItems.splice(targetIndex, 0, movedItem)

  return nextItems
}

export function reorderIds(ids: string[], sourceId: string, targetId: string) {
  const sourceIndex = ids.indexOf(sourceId)
  const targetIndex = ids.indexOf(targetId)

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return ids
  }

  const nextIds = [...ids]
  const [movedId] = nextIds.splice(sourceIndex, 1)

  nextIds.splice(targetIndex, 0, movedId)

  return nextIds
}
