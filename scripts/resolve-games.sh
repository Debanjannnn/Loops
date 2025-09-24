#!/bin/bash

# Configuration
CONTRACT_ID="game-v0.testnet"
RESOLVER_ACCOUNT_ID="resolver-v0.testnet"
PRIVATE_KEY="ed25519:4EfkzL95mEn3Jqy7hmR4Q6kxCXnLeDzwvYWm5PJjVoHDX2jAEu1EP6R5Bbqcj8Vr2xft9hG5t8pdWZmTZVTn5sW"

echo "🚀 Game Resolver Script"
echo "📋 Contract: $CONTRACT_ID"
echo "🔑 Resolver: $RESOLVER_ACCOUNT_ID"

# Get pending games
echo "📊 Fetching pending games..."
PENDING_GAMES=$(near view $CONTRACT_ID get_pending_games --networkId testnet)

echo "📊 Pending games: $PENDING_GAMES"

# Parse and resolve each game
echo "$PENDING_GAMES" | jq -r '.[]' | while read gameId; do
    if [ -n "$gameId" ]; then
        echo "🎮 Processing game: $gameId"
        
        # Get game details
        GAME_DETAILS=$(near view $CONTRACT_ID get_game_details "{\"gameId\": \"$gameId\"}" --networkId testnet)
        echo "📋 Game details: $GAME_DETAILS"
        
        # Simple resolution logic (50% win rate, 2x multiplier for wins)
        if [ $((RANDOM % 2)) -eq 0 ]; then
            DID_WIN="true"
            MULTIPLIER="2.0"
            echo "🎲 Resolving as WIN (2.0x)"
        else
            DID_WIN="false"
            MULTIPLIER="1.0"
            echo "🎲 Resolving as LOSE (1.0x)"
        fi
        
        # Resolve the game
        echo "📡 Resolving game $gameId..."
        near call $CONTRACT_ID resolve_game "{\"gameId\": \"$gameId\", \"didWin\": $DID_WIN, \"multiplier\": $MULTIPLIER}" --accountId $RESOLVER_ACCOUNT_ID --networkId testnet --private-key $PRIVATE_KEY
        
        echo "✅ Game $gameId resolved!"
        echo "---"
    fi
done

echo "🎉 All games processed!"
