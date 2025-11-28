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
        const { key, year, month, timezone } = body

        // Get apiUrl from query parameter or header as fallback
        const url = new URL(req.url)
        const apiUrlFromQuery = url.searchParams.get('apiUrl')
        const apiUrl = body.apiUrl || apiUrlFromQuery || req.headers.get('x-api-url')

        if (!apiUrl) {
            return corsResponse(NextResponse.json({ success: false, message: 'Missing required parameter: apiUrl' }, { status: 400 }))
        }

        if (!key || year === undefined || month === undefined || !timezone) {
            return corsResponse(NextResponse.json({ success: false, message: 'Missing required parameters: key, year, month, timezone' }, { status: 400 }))
        }

        // Parse Timezone Offset
        // Assuming timezone format like "+8" or "-11" or "+08:00"
        // Simple parsing for now:
        let offsetHours = 0;
        try {
            // Remove colon if present to handle +08:00 as +0800 or just parse integer part
            const cleanTimezone = timezone.replace(':', '');
            offsetHours = parseInt(cleanTimezone);
            if (isNaN(offsetHours)) {
                throw new Error('Invalid timezone format');
            }
        } catch (e) {
            return corsResponse(NextResponse.json({ success: false, message: 'Invalid timezone format. Expected offset like "+8" or "-0500"' }, { status: 400 }))
        }

        // Calculate Start and End Timestamps
        // We want 1st of the month 00:00:00 in the given timezone.
        // UTC Timestamp = Local Timestamp - (Offset * 3600)

        // Javascript Date(year, monthIndex, day) creates date in Local environment time, which is not what we want.
        // We should use Date.UTC(year, monthIndex, day) to get UTC timestamp of that date at 00:00:00 UTC.
        // Then subtract offset to shift it to the target timezone's 00:00:00.

        // Note: month input is 1-12, Date.UTC expects 0-11.
        const startUtc = Date.UTC(year, month - 1, 1) / 1000; // seconds
        const endUtc = Date.UTC(year, month, 1) / 1000; // seconds (month + 1 handles rollover to next year automatically)

        const offsetSeconds = offsetHours * 3600;
        const start = startUtc - offsetSeconds;
        const end = endUtc - offsetSeconds;

        const daysInMonth = (end - start) / (24 * 3600);

        // 1. Fetch Config
        const configString = await redis.get(apiUrl);
        const config = configString ? JSON.parse(configString) : {};

        // 2. Determine Multiplier
        let multiplier = 1;
        if (config.multipliers) {
            if (config.multipliers[key] !== undefined) {
                multiplier = config.multipliers[key];
            } else {
                const wildcardMatch = Object.keys(config.multipliers).find((k) => {
                    const regex = new RegExp(k.replace(/\*/g, '.*'));
                    return regex.test(key);
                });
                if (wildcardMatch) {
                    multiplier = config.multipliers[wildcardMatch];
                }
            }
        }

        // 3. Determine Unit (Optional, for response)
        let unit = '';
        if (config.units) {
            if (config.units[key] !== undefined) {
                unit = config.units[key];
            } else {
                const wildcardMatch = Object.keys(config.units).find((k) => {
                    const regex = new RegExp(k.replace(/\*/g, '.*'));
                    return regex.test(key);
                });
                if (wildcardMatch) {
                    unit = config.units[wildcardMatch];
                }
            }
        }


        // 4. Fetch Data from TSDB
        const payload = {
            operation: "read",
            key: key,
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
            throw new Error(`TSDB API error: ${response.statusText}`);
        }

        const energyUsage = await response.json();

        if (!energyUsage.success || !energyUsage.data) {
            return corsResponse(NextResponse.json({ success: false, message: 'No data returned from TSDB' }, { status: 404 }))
        }

        const dataArray = energyUsage.data;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return corsResponse(NextResponse.json({ success: false, message: 'Empty data array from TSDB' }, { status: 404 }))
        }

        // 5. Calculate Average
        let accumulatedValue = 0;
        dataArray.forEach((entry: any) => {
            accumulatedValue += entry.value;
        });

        const averageValue = accumulatedValue / dataArray.length;

        // 6. Calculate Monthly Usage
        // multiply by 24 hours to get daily average, and then by daysInMonth to get monthly average
        // and apply the multiplier from config
        const dailyAverage = averageValue * 24;
        const monthlyAverage = dailyAverage * daysInMonth;
        const finalMonthlyUsage = monthlyAverage * multiplier;

        return corsResponse(NextResponse.json({
            success: true,
            data: {
                monthlyUsage: finalMonthlyUsage,
                averageValue: averageValue,
                multiplier: multiplier,
                unit: unit,
                daysInMonth: daysInMonth,
                dataPoints: dataArray.length,
                timeRange: {
                    start: start,
                    end: end,
                    timezone: timezone
                }
            }
        }));

    } catch (error) {
        console.error('Error in monthly-average-power-hour-product API:', error)
        return corsResponse(NextResponse.json({ success: false, message: 'An error occurred', debug: error instanceof Error ? error.message : String(error) }, { status: 500 }))
    }
}
