module.exports = {
    ci: {
        collect: {
            startServerCommand: 'npm run dev',
            url: ['http://localhost:5173/', 'http://localhost:5173/login'],
            numberOfRuns: 3,
        },
        assert: {
            assertions: {
                'categories:performance': ['warn', { minScore: 0.7 }],
                'categories:accessibility': ['error', { minScore: 0.9 }],
                'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
            },
        },
        upload: {
            target: 'temporary-public-storage',
        },
    },
};
