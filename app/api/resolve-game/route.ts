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
    
    console.log(`🚀 Resolving game: ${gameId}`);
    console.log(`📋 Outcome: ${didWin ? 'WIN' : 'LOSE'} with ${multiplier}x multiplier`);
    console.log(`📋 Game type: ${gameType}, Player: ${player}`);
    
    // Call the resolve script directly
    const scriptPath = './scripts/resolve-single-game.sh';
    const command = `${scriptPath} "${gameId}" ${didWin} ${multiplier}`;
    
    console.log(`🔧 Executing command: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 30000, // 30 second timeout
      });
      
      if (stderr) {
        console.warn('⚠️ Script stderr:', stderr);
      }
      
      console.log('✅ Script output:', stdout);
      
      // Parse the output to check if it was successful
      // The script can succeed even if the game doesn't exist (for testing)
      if (stdout.includes('Transaction sent') || stdout.includes('signed successfully') || stdout.includes('Transaction ID:')) {
        return NextResponse.json({
          success: true,
          message: `Game ${gameId} resolution transaction sent successfully`,
          gameId,
          didWin,
          multiplier,
          output: stdout.trim(),
          note: "Transaction was signed and sent to the blockchain"
        });
      } else if (stdout.includes('Game not found')) {
        return NextResponse.json({
          success: false,
          message: `Game ${gameId} not found in contract`,
          gameId,
          didWin,
          multiplier,
          output: stdout.trim(),
          note: "This is expected for test games that don't exist in the contract"
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
      console.error('❌ Script execution failed:', execError);
      
      // Check if it's a timeout error
      if (execError.code === 'TIMEOUT') {
        return NextResponse.json({
          success: false,
          message: 'Script execution timed out after 30 seconds',
          gameId,
          didWin,
          multiplier
        }, { status: 408 });
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