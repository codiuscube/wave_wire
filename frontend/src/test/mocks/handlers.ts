import { http, HttpResponse } from 'msw'



export const handlers = [
    // Mock NOAA Buoy API
    http.get('/api/noaa-buoy', ({ request }) => {
        const url = new URL(request.url)
        const stationId = url.searchParams.get('station')

        if (stationId === 'INVALID') {
            return new HttpResponse(null, { status: 404 })
        }

        if (stationId === 'OFFLINE') {
            const oldData = `
#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
2020 01 01 12 00 140  5.0  6.0  1.5    8    6   130   1015.0 25.0  26.0  22.0   MM   +1.0   MM
        `
            return HttpResponse.text(oldData)
        }

        // Generate current date for mock data
        const now = new Date();
        const yyyy = now.getUTCFullYear();
        const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(now.getUTCDate()).padStart(2, '0');
        const hh = String(now.getUTCHours()).padStart(2, '0');
        const min = String(now.getUTCMinutes()).padStart(2, '0');

        const mockData = `
#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
${yyyy} ${mm} ${dd} ${hh} ${min} 140  5.0  6.0  1.5    8    6   130   1015.0 25.0  26.0  22.0   MM   +1.0   MM
`
        return HttpResponse.text(mockData)
    }),

    // Mock Wave Summary API
    http.post('/api/wave-summary', () => {
        return HttpResponse.json({
            summary: 'Conditions are favorable with clean waves around 3-4ft.',
            rating: 'GOOD'
        })
    }),
]
