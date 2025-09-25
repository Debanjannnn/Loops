import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
    
    console.log(`🔧 Contract: ${CONTRACT_ID}`);
    console.log(`🔑 Resolver: ${RESOLVER_ACCOUNT_ID}`);
    
    // Use the same approach as development but with environment variables
    // Create a temporary script that uses the NEAR CLI
    const scriptContent = `#!/bin/bash
export CONTRACT_ID="${CONTRACT_ID}"
export RESOLVER_ACCOUNT_ID="${RESOLVER_ACCOUNT_ID}"
export RESOLVER_PRIVATE_KEY="${RESOLVER_PRIVATE_KEY}"

# Call the contract directly using near CLI
near call ${CONTRACT_ID} resolve_game "{\\"gameId\\": \\"${gameId}\\", \\"didWin\\": ${didWin}, \\"multiplier\\": ${multiplier}}" --accountId ${RESOLVER_ACCOUNT_ID} --networkId testnet --private-key ${RESOLVER_PRIVATE_KEY}
`;
    
    // Write script to temporary file
    const fs = require('fs');
    const path = require('path');
    const tempScriptPath = path.join('/tmp', `resolve-${Date.now()}.sh`);
    
    fs.writeFileSync(tempScriptPath, scriptContent);
    fs.chmodSync(tempScriptPath, '755');
    
    try {
      console.log(`🔧 Executing NEAR CLI command for game ${gameId}`);
      
      const { stdout, stderr } = await execAsync(`bash ${tempScriptPath}`, { 
        timeout: 60000, // 60 second timeout
        cwd: process.cwd()
      });
      
      // Clean up temp file
      fs.unlinkSync(tempScriptPath);
      
      if (stderr) {
        console.warn('⚠️ Script stderr:', stderr);
      }
      
      console.log('✅ Script output:', stdout);
      
      // Parse the output to check if it was successful
      if (stdout.includes('Transaction sent') || stdout.includes('signed successfully') || stdout.includes('Transaction ID:') || stdout.includes('Your transaction was signed successfully')) {
        return NextResponse.json({
          success: true,
          message: `Game ${gameId} resolved successfully on blockchain`,
          gameId,
          didWin,
          multiplier,
          gameType,
          player,
          contractId: CONTRACT_ID,
          resolverAccountId: RESOLVER_ACCOUNT_ID,
          output: stdout.trim(),
          timestamp: new Date().toISOString(),
          note: "Game was successfully resolved on the NEAR blockchain in real-time using NEAR CLI"
        });
      } else if (stdout.includes('Game not found') || stdout.includes('Game already resolved')) {
        return NextResponse.json({
          success: true,
          message: `Game ${gameId} transaction processed successfully`,
          gameId,
          didWin,
          multiplier,
          output: stdout.trim(),
          note: stdout.includes('Game not found') 
            ? "Game not found in contract (expected for test games)" 
            : "Game was already resolved (expected for previously resolved games)"
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Game resolution failed. Output: ${stdout.trim()}`,
          gameId,
          didWin,
          multiplier,
          output: stdout.trim()
        });
      }
      
    } catch (execError: any) {
      // Clean up temp file
      try {
        fs.unlinkSync(tempScriptPath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
      
      console.error('❌ Script execution failed:', execError);
      
      // Check if the transaction was actually processed despite the error
      const errorOutput = execError.message || '';
      if (errorOutput.includes('Your transaction was signed successfully') && 
          (errorOutput.includes('Game not found') || errorOutput.includes('Game already resolved'))) {
        return NextResponse.json({
          success: true,
          message: `Game ${gameId} transaction processed successfully`,
          gameId,
          didWin,
          multiplier,
          gameType,
          player,
          contractId: CONTRACT_ID,
          resolverAccountId: RESOLVER_ACCOUNT_ID,
          output: errorOutput,
          timestamp: new Date().toISOString(),
          note: errorOutput.includes('Game not found') 
            ? "Game not found in contract (expected for test games)" 
            : "Game was already resolved (expected for previously resolved games)"
        });
      }
      
      // Check if it's a timeout error
      if (execError.killed && execError.signal === 'SIGTERM') {
        return NextResponse.json({
          success: false,
          message: `Script execution timed out after 60 seconds for game ${gameId}`,
          gameId,
          didWin,
          multiplier,
          error: execError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: false,
        message: `Script execution failed: ${execError.message}`,
        gameId,
        didWin,
        multiplier,
        error: execError.message
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ Production Resolver: Error resolving game:', error);
    return NextResponse.json(
      { success: false, message: `Error resolving game: ${error.message}` },
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