import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, didWin, multiplier, gameType, player } = body;
    
    if (!gameId || didWin === undefined || !multiplier) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: gameId, didWin, multiplier' },
        { status: 400 }
      );
    }
    
    console.log(`🚀 Resolving game: ${gameId}`);
    console.log(`📋 Outcome: ${didWin ? 'WIN' : 'LOSE'} with ${multiplier}x multiplier`);
    console.log(`📋 Game type: ${gameType}, Player: ${player}`);
    
    // Forward the request to the trigger server (only for development)
    const triggerServerUrl = process.env.TRIGGER_SERVER_URL || 'http://localhost:3002';
    
    const response = await fetch(`${triggerServerUrl}/resolve-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId,
        didWin,
        multiplier,
        gameType,
        player
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Game resolved successfully:', result);
      return NextResponse.json(result);
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to resolve game:', errorData.message);
      return NextResponse.json(
        { success: false, message: errorData.message },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('❌ Error resolving game:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
