import { NextResponse } from 'next/server'

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
    const apiUrl = req.headers.get('x-api-url') || 'http://gtsdb-web.abby.md'
    console.log('Server side: API URL:', apiUrl)
    console.log('Server side: Request body:', body)
    body = typeof body === 'string' ? JSON.parse(body) : body

    switch (body.operation) {
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
    console.error('Error in API route:', error)
    return NextResponse.json({ success: false, message: 'An error occurred' }, { status: 500 })
  }
}

