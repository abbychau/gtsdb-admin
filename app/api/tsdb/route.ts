import { NextResponse } from 'next/server'
import { createClient } from 'redis';
const redis = await createClient().connect();
async function fetchFromAPI(body: any, apiUrl: string) {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching from API:', error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    let body = await req.json()
    
    // Get apiUrl from query parameter or header as fallback, or use default
    const url = new URL(req.url)
    const apiUrlFromQuery = url.searchParams.get('apiUrl')
    const apiUrl = apiUrlFromQuery || req.headers.get('x-api-url') || 'http://gtsdb-web.abby.md'
    
    console.log('Server side: API URL:', apiUrl)
    console.log('Server side: Request body:', body)
    body = typeof body === 'string' ? JSON.parse(body) : body

    switch (body.operation) {
      case 'getapiurlconfig': {
        const configString = await redis.get(apiUrl);

        if (!configString) {
          //return {}
          return NextResponse.json({ success: true, data: {} })
        }

        const config = JSON.parse(configString)
        
        /* format of config: (WARNING, it is NOT the default value,
        let client to decide the default value, this is just an example
        of what the config object might look like.
        return {} if no config is found in redis, 
        then the client should not multiply the values by anything,
        and do not append any units to the values.

        )
        {
          "multipliers": {
            "<name1>": 1,
            "<name2>": 1.23456,
            ...
          },
          "units": {
            "...": "°C",
            "...": "%",
          },
          ...
        }
          default: {} (empty object)
        */
        return NextResponse.json({ success: true, data: config })
      }
      case 'setapiurlconfig': {
        try {
          // Validate that body.config is an object
          if (!body.config || typeof body.config !== 'object') {
            return NextResponse.json({ 
              success: false, 
              message: 'Invalid configuration format. Expected an object.'
            }, { status: 400 });
          }
          
          // Store the config in Redis
          const configToStore = JSON.stringify(body.config);
          await redis.set(apiUrl, configToStore);
          
          return NextResponse.json({ success: true, message: 'Configuration saved successfully' });
        } catch (error) {
          console.error('Error saving configuration:', error);
          return NextResponse.json({ 
            success: false, 
            message: 'Failed to save configuration',
            debug: error
          }, { status: 500 });
        }
      }
      case 'subscribe': {
        const encoder = new TextEncoder()
        const stream = new TransformStream()
        const writer = stream.writable.getWriter()
        console.log(body)
        // Start SSE connection to API
        fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).then(async response => {
          console.log(response)
          const reader = response.body?.getReader()
          if (!reader) throw new Error('No reader available')
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            await writer.write(encoder.encode(`data: ${new TextDecoder().decode(value)}\n\n`))
          }
        }).catch(error => {
          console.error('SSE Error:', error)
          writer.close()
        })

        return new Response(stream.readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }
      case 'ids':
      case 'idswithcount':
      case 'read':
      case 'write':
      case 'unsubscribe':
      case 'initkey':
      case 'deletekey':
      case 'renamekey':
      case 'multi-read':
      case 'serverInfo': {
        const data = await fetchFromAPI(body, apiUrl)
        return NextResponse.json({ success: true, data })
      }
      default:
        return NextResponse.json({ success: false, message: 'BFF: Invalid operation' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in API route:', req.body)
    console.error(error)
    return NextResponse.json({ success: false, message: 'An error occurred', debug: error }, { status: 500 })
  }
}

