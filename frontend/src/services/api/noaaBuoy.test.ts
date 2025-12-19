import { fetchBuoyData } from './noaaBuoy'
import { describe, it, expect } from 'vitest'

describe('fetchBuoyData', () => {
    it('fetches and parses buoy data successfully', async () => {
        const result = await fetchBuoyData('42035')

        expect(result.error).toBeNull()
        expect(result.data).not.toBeNull()
        expect(result.data?.waveHeight).toBeGreaterThan(0)
    })

    it('handles invalid station ID gracefully', async () => {
        const result = await fetchBuoyData('INVALID')

        expect(result.error).not.toBeNull()
        expect(result.data).toBeNull()
    })
})
