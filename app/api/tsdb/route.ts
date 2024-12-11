import { NextResponse } from 'next/server'

const API_URL = 'http://104.155.192.48:5556'

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
      case 'ids':
      case 'read':
      case 'write':
      case 'subscribe':
      case 'unsubscribe':
      case 'initkey':
      case 'deletekey':
      case 'rename':
        const data = await fetchFromAPI(body)
        return NextResponse.json({ success: true, data })
      default:
        return NextResponse.json({ success: false, message: 'Invalid operation' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json({ success: false, message: 'An error occurred' }, { status: 500 })
  }
}

