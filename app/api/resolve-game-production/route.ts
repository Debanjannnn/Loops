import { NextRequest, NextResponse } from 'next/server';
import { providers, keyStores, connect, Contract } from 'near-api-js';

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
    
    // Get environment variables
    const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
    const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID || 'resolver-v0.testnet';
    const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY;
    
    if (!RESOLVER_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, message: 'Resolver private key not configured' },
        { status: 500 }
      );
    }
    
    // Set up NEAR connection with multiple RPC endpoints for reliability
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = require('near-api-js').utils.KeyPairEd25519.fromString(RESOLVER_PRIVATE_KEY);
    await keyStore.setKey('testnet', RESOLVER_ACCOUNT_ID, keyPair);
    
    const rpcEndpoints = [
      'https://near-testnet.api.pagoda.co/rpc/v1', // Pagoda - usually more reliable
      'https://testnet-rpc.near.org', // Official backup
      'https://rpc.testnet.near.org', // Official (deprecated but still works sometimes)
      'https://near-testnet.lava.build', // Lava RPC
      'https://testnet.nearapi.org' // Alternative provider
    ];
    
    let result;
    let lastError;
    
    for (const nodeUrl of rpcEndpoints) {
      try {
        console.log(`🔗 Connecting to NEAR via ${nodeUrl}`);
        
        const near = await connect({
          networkId: 'testnet',
          keyStore,
          nodeUrl,
        });
        
        const account = await near.account(RESOLVER_ACCOUNT_ID);
        
        // Check account balance first
        const balance = await account.getAccountBalance();
        console.log(`💰 Resolver account balance: ${balance.available} yoctoNEAR`);
        
        // Call the contract to resolve the game
        result = await account.functionCall({
          contractId: CONTRACT_ID,
          methodName: 'resolve_game',
          args: {
            gameId: gameId,
            didWin: didWin,
            multiplier: multiplier
          },
          gas: BigInt('300000000000000'), // 300 TGas
          attachedDeposit: BigInt('0')
        });
        
        console.log(`✅ Successfully resolved game via ${nodeUrl}`);
        break; // Success, exit the loop
        
      } catch (error: any) {
        console.warn(`❌ Failed to resolve via ${nodeUrl}:`, error.message);
        lastError = error;
        continue; // Try next endpoint
      }
    }
    
    if (!result) {
      throw lastError || new Error('Failed to resolve game on all RPC endpoints');
    }
    
    console.log('✅ Game resolved successfully:', result);
    
    return NextResponse.json({
      success: true,
      message: `Game ${gameId} resolved successfully`,
      gameId,
      didWin,
      multiplier,
      transactionHash: result.transaction.hash,
      timestamp: new Date().toISOString()
    });
    
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
