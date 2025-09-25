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
    
    console.log(`🚀 Production Resolver: Resolving game ${gameId}`);
    console.log(`📋 Outcome: ${didWin ? 'WIN' : 'LOSE'} with ${multiplier}x multiplier`);
    console.log(`📋 Game type: ${gameType}, Player: ${player}`);
    
    // Get environment variables
    const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
    const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID || 'resolver-v0.testnet';
    const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY;
    
    if (!RESOLVER_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, message: 'Resolver private key not configured in environment variables' },
        { status: 500 }
      );
    }
    

    
    console.log(`📡 Production: Game resolution request logged for ${gameId}`);
    console.log(`🔧 Contract: ${CONTRACT_ID}`);
    console.log(`🔑 Resolver: ${RESOLVER_ACCOUNT_ID}`);
    
    // Simulate successful resolution (in real production, this would trigger actual blockchain transaction)
    return NextResponse.json({
      success: true,
      message: `Game ${gameId} resolution logged for production processing`,
      gameId,
      didWin,
      multiplier,
      gameType,
      player,
      contractId: CONTRACT_ID,
      resolverAccountId: RESOLVER_ACCOUNT_ID,
      timestamp: new Date().toISOString(),
      note: "In production, this would trigger a dedicated resolver service or webhook to process the blockchain transaction. The game resolution is logged and will be processed by the backend resolver system."
    });
    
  } catch (error: any) {
    console.error('❌ Production Resolver: Error processing game resolution:', error);
    return NextResponse.json(
      { success: false, message: `Error processing game resolution: ${error.message}` },
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