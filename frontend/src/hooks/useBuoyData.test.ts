import { renderHook, waitFor } from '@testing-library/react'
import { useBuoyData } from './useBuoyData'
import { describe, it, expect } from 'vitest'

describe('useBuoyData', () => {
    it('returns initial state', () => {
        const { result } = renderHook(() => useBuoyData('42035', { fetchOnMount: false }))
        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).toBeNull()
        expect(result.current.error).toBeNull()
    })

    it('fetches data on mount', async () => {
        const { result } = renderHook(() => useBuoyData('42035'))

        expect(result.current.isLoading).toBe(true)

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.data).not.toBeNull()
        expect(result.current.data?.waveHeight).toBeDefined()
    })

    it('handles errors', async () => {
        const { result } = renderHook(() => useBuoyData('INVALID'))

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.error).toBeTruthy()
    })
})
