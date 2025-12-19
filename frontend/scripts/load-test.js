const autocannon = require('autocannon');

const runTest = (url, options, name) => {
    return new Promise((resolve, reject) => {
        console.log(`Running load test for ${name} (${url})...`);
        const instance = autocannon({
            url,
            ...options,
        });

        autocannon.track(instance, { renderProgressBar: true });

        instance.on('done', (result) => {
            console.log(`\nResults for ${name}:`);
            console.log(`Latency (p99): ${result.latency.p99}ms`);
            console.log(`Errors: ${result.errors}`);
            console.log(`Timeouts: ${result.timeouts}`);

            const p99Threshold = options.thresholds?.p99 || 1000;
            const errorThreshold = options.thresholds?.errorRate || 0.01;
            const errorRate = (result.errors + result.timeouts) / result.requests.total;

            let passed = true;

            if (result.latency.p99 > p99Threshold) {
                console.error(`❌ Latency p99 exceeded threshold (${p99Threshold}ms)`);
                passed = false;
            } else {
                console.log(`✅ Latency p99 within threshold`);
            }

            if (errorRate > errorThreshold) {
                console.error(`❌ Error rate exceeded threshold (${errorThreshold * 100}%)`);
                passed = false;
            } else {
                console.log(`✅ Error rate within threshold`);
            }

            resolve(passed);
        });

        instance.on('error', (err) => {
            console.error(`Error running ${name} test:`, err);
            resolve(false);
        });
    });
};

const runAllTests = async () => {
    // Tests are run against localhost:3000 by default (Next.js/Node API)
    // Adjust base URL as needed based on where API is running
    const BASE_URL = process.env.API_URL || 'http://localhost:3000';

    const cleanPass = await runTest(`${BASE_URL}/api/noaa-buoy?station=42035`, {
        connections: 10,
        duration: 10,
        thresholds: { p99: 2000, errorRate: 0.01 }
    }, 'NOAA Buoy API');

    const summaryPass = await runTest(`${BASE_URL}/api/wave-summary`, {
        connections: 5,
        duration: 10,
        method: 'POST',
        thresholds: { p99: 5000, errorRate: 0.05 }
    }, 'Wave Summary API');

    if (!cleanPass || !summaryPass) {
        console.error('\n❌ Load tests failed.');
        process.exit(1);
    } else {
        console.log('\n✅ All load tests passed.');
        process.exit(0);
    }
};

runAllTests();
