import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../lib/api/categoryProjectMap', () => ({
  fetchCategoryProjectMap: vi.fn().mockResolvedValue({}),
  upsertCategoryProjectAssignment: vi.fn().mockResolvedValue(undefined),
  bulkUploadCategoryProjectMap: vi.fn().mockResolvedValue(undefined),
}))

import { useProjectStore } from '../data/projectStore'

describe('projectStore — CLAUDE.md "archive only" rule', () => {
  beforeEach(() => {
    useProjectStore.getState().resetToDefaults()
  })

  it('archiveProject flips status without removing the project', () => {
    const before = useProjectStore.getState().projects.length
    useProjectStore.getState().archiveProject('periphery-v2', 'test reason')
    const after = useProjectStore.getState().projects.length
    expect(after).toBe(before)
    const archived = useProjectStore.getState().getProjectById('periphery-v2')
    expect(archived?.status).toBe('archived')
    expect(archived?.archiveReason).toBe('test reason')
    expect(archived?.archivedAt).toBeTruthy()
  })

  it('resetToDefaults restores the two seeded projects and clears the map', () => {
    useProjectStore.getState().assignCategoryToProject('cat-1', 'periphery-v2')
    expect(useProjectStore.getState().categoryProjectMap['cat-1']).toBe('periphery-v2')

    useProjectStore.getState().resetToDefaults()

    expect(useProjectStore.getState().categoryProjectMap).toEqual({})
    expect(useProjectStore.getState().activeProjectId).toBe('periphery-v2')
  })

  it('getProjectIdForCategory falls back to periphery-v1 for unmapped categories', () => {
    expect(useProjectStore.getState().getProjectIdForCategory('never-seen')).toBe('periphery-v1')
  })
})
