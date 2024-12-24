import { NextResponse } from 'next/server'

const API_URL = 'http://gtsdb-web.abby.md'

async function fetchFromAPI(body: any) {
  try {
    const response = await fetch(API_URL, {
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
    const body = await req.json()
    

    switch (body.operation) {
      case 'subscribe': {
        const encoder = new TextEncoder()
        const stream = new TransformStream()
        const writer = stream.writable.getWriter()
        console.log(body)
        // Start SSE connection to API
        fetch(API_URL, {
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
      case 'read':
      case 'write':
      case 'unsubscribe':
      case 'initkey':
      case 'deletekey':
      case 'renamekey':
      case 'serverInfo': {
        const data = await fetchFromAPI(body)
        return NextResponse.json({ success: true, data })
      }
      default:
        return NextResponse.json({ success: false, message: 'BFF: Invalid operation' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json({ success: false, message: 'An error occurred' }, { status: 500 })
  }
}

