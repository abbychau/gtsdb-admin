import { NextResponse } from 'next/server'
import { createClient } from 'redis';

// Add CORS headers to all responses
function corsResponse(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-url')
    return response
}

const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export async function OPTIONS(req: Request) {
    return corsResponse(NextResponse.json({}, { status: 200 }))
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { key, from, to, type, timezone } = body

        // Get apiUrl from query parameter or header as fallback
        const url = new URL(req.url)
        const apiUrlFromQuery = url.searchParams.get('apiUrl')
        const apiUrl = body.apiUrl || apiUrlFromQuery || req.headers.get('x-api-url')

        if (!apiUrl) {
            return corsResponse(NextResponse.json({ success: false, message: 'Missing required parameter: apiUrl' }, { status: 400 }))
        }

        if (!key || !from || !to || !type || !timezone) {
            return corsResponse(NextResponse.json({ success: false, message: 'Missing required parameters: key, from, to, type, timezone' }, { status: 400 }))
        }

        // Normalize key to array
        const keys = Array.isArray(key) ? key : [key];

        // Parse Timezone Offset
        let offsetHours = 0;
        try {
            const cleanTimezone = timezone.replace(':', '');
            offsetHours = parseInt(cleanTimezone);
            if (isNaN(offsetHours)) {
                throw new Error('Invalid timezone format');
            }
        } catch (e) {
            return corsResponse(NextResponse.json({ success: false, message: 'Invalid timezone format. Expected offset like "+8" or "-0500"' }, { status: 400 }))
        }

        // Calculate Start and End Timestamps
        const startUtc = Date.UTC(from.year, from.month - 1, from.day) / 1000;
        const endUtc = Date.UTC(to.year, to.month - 1, to.day) / 1000;

        const offsetSeconds = offsetHours * 3600;
        const start = startUtc - offsetSeconds;
        const end = endUtc - offsetSeconds;

        const durationInSeconds = end - start;
        if (durationInSeconds <= 0) {
            return corsResponse(NextResponse.json({ success: false, message: 'Invalid date range: end date must be after start date' }, { status: 400 }))
        }

        const durationInDays = durationInSeconds / (24 * 3600);

        // 1. Fetch Config
        const configString = await redis.get(apiUrl);
        const config = configString ? JSON.parse(configString) : {};

        // Initialize Aggregates
        let totalEnergySum = 0;
        let averageValueSum = 0;
        let totalDataPoints = 0;
        let combinedDailyUsage: { [date: string]: { energy: number, averageValue: number, dataPoints: number } } = {};
        let firstUnit = '';

        // Loop through keys
        for (const currentKey of keys) {
            // 2. Determine Multiplier
            let multiplier = 1;
            if (config.multipliers) {
                if (config.multipliers[currentKey] !== undefined) {
                    multiplier = config.multipliers[currentKey];
                } else {
                    const wildcardMatch = Object.keys(config.multipliers).find((k) => {
                        const regex = new RegExp(k.replace(/\*/g, '.*'));
                        return regex.test(currentKey);
                    });
                    if (wildcardMatch) {
                        multiplier = config.multipliers[wildcardMatch];
                    }
                }
            }

            // 3. Determine Unit (Use first key's unit for response)
            if (!firstUnit) {
                if (config.units) {
                    if (config.units[currentKey] !== undefined) {
                        firstUnit = config.units[currentKey];
                    } else {
                        const wildcardMatch = Object.keys(config.units).find((k) => {
                            const regex = new RegExp(k.replace(/\*/g, '.*'));
                            return regex.test(currentKey);
                        });
                        if (wildcardMatch) {
                            firstUnit = config.units[wildcardMatch];
                        }
                    }
                }
            }

            // 4. Fetch Data from TSDB
            const payload = {
                operation: "read",
                key: currentKey,
                Read: {
                    start_timestamp: start,
                    end_timestamp: end
                }
            }

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Continue or throw? Let's log and treat as empty for robustness? 
                // Or fail fast. Failing fast is safer for now.
                throw new Error(`TSDB API error for key ${currentKey}: ${response.statusText}`);
            }

            const energyUsage = await response.json();

            if (!energyUsage.success || !energyUsage.data) {
                // Skip this key if no data? Or fail? 
                // Let's treat as empty data.
                continue;
            }

            const dataArray = energyUsage.data;
            if (!Array.isArray(dataArray) || dataArray.length === 0) {
                continue;
            }

            totalDataPoints += dataArray.length;

            // 5. Process Data
            if (type === 'daily') {
                // Group by day
                const buckets: { [date: string]: { sum: number, count: number } } = {};

                dataArray.forEach((entry: any) => {
                    const localTimestamp = entry.timestamp + offsetSeconds;
                    const date = new Date(localTimestamp * 1000);
                    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

                    if (!buckets[dateStr]) {
                        buckets[dateStr] = { sum: 0, count: 0 };
                    }
                    buckets[dateStr].sum += entry.value;
                    buckets[dateStr].count++;
                });

                // Calculate daily energy and add to combined
                Object.keys(buckets).forEach(dateStr => {
                    const { sum, count } = buckets[dateStr];
                    const avg = sum / count;
                    const dailyEnergy = avg * 24 * multiplier;

                    if (!combinedDailyUsage[dateStr]) {
                        combinedDailyUsage[dateStr] = { energy: 0, averageValue: 0, dataPoints: 0 };
                    }
                    combinedDailyUsage[dateStr].energy += dailyEnergy;
                    combinedDailyUsage[dateStr].averageValue += avg; // Summing average power
                    combinedDailyUsage[dateStr].dataPoints += count;

                    totalEnergySum += dailyEnergy;
                });

                // Global average for this key
                let globalSum = 0;
                dataArray.forEach((entry: any) => globalSum += entry.value);
                averageValueSum += (globalSum / dataArray.length);

            } else {
                // Standard calculation
                let accumulatedValue = 0;
                dataArray.forEach((entry: any) => {
                    accumulatedValue += entry.value;
                });

                const averageValue = accumulatedValue / dataArray.length;
                const dailyAverage = averageValue * 24;
                const totalEnergy = dailyAverage * durationInDays * multiplier;

                totalEnergySum += totalEnergy;
                averageValueSum += averageValue;
            }
        }

        // Format Daily Usage Response
        let dailyUsageResponse: any[] | undefined = undefined;
        if (type === 'daily') {
            dailyUsageResponse = Object.keys(combinedDailyUsage).sort().map(dateStr => ({
                date: dateStr,
                energy: combinedDailyUsage[dateStr].energy,
                averageValue: combinedDailyUsage[dateStr].averageValue,
                dataPoints: combinedDailyUsage[dateStr].dataPoints
            }));
        }

        return corsResponse(NextResponse.json({
            success: true,
            data: {
                totalEnergy: totalEnergySum,
                averageValue: averageValueSum,
                multiplier: 1, // Multiplier is applied per key, so global multiplier is effectively 1 (or N/A)
                unit: firstUnit,
                durationInDays: durationInDays,
                dataPoints: totalDataPoints,
                type: type,
                dailyUsage: dailyUsageResponse,
                timeRange: {
                    start: start,
                    end: end,
                    timezone: timezone
                }
            }
        }));

    } catch (error) {
        console.error('Error in average-power-hour-product API:', error)
        return corsResponse(NextResponse.json({ success: false, message: 'An error occurred', debug: error instanceof Error ? error.message : String(error) }, { status: 500 }))
    }
}
