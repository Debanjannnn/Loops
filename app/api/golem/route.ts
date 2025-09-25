// app/api/your-endpoint/route.ts
import {
  createClient,
  AccountData,
  Tagged,
  GolemBaseCreate,
  Annotation,
  GolemBaseUpdate,
} from "golem-base-sdk";

const key: AccountData = new Tagged(
  "privatekey",
  Buffer.from(
    "bfcb7d6bf916cc6fbf48f35c2cbc61989297d8d95cb08e461494411ab69af979",
    "hex"
  )
); // TODO: replace with your private key, this variable will be used in the mutations operations
const chainId = 60138453025; // ID of the chain of our public testnet - Kaolin
const rpcUrl = "https://kaolin.holesky.golemdb.io/rpc"; // RPC URL of the chain
const wsUrl = "wss://kaolin.holesky.golemdb.io/rpc/ws"; // WebSocket URL of the chain

// TextEncoder and TextDecoder are used to encode and decode data from text into bytes and vice versa
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Create a client to interact with the GolemDB API
const client = await createClient(chainId, key, rpcUrl, wsUrl);

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json(); // Fix: Add parentheses
    console.log("Received data:", body);

    // Process the data from the body and send to GolemDB
    const id = Math.floor(Math.random() * 1000000); // Fix: Generate integer instead of float
    const dataToStore = JSON.stringify({
      accountId: body.accountId,
    });

    const creates = [
      {
        data: encoder.encode(dataToStore),
        btl: 600,
        stringAnnotations: [
          new Annotation("accountId", body.accountId),
          new Annotation("dataType", "userStats"),
          new Annotation("id", id.toString()),
        ],
        numericAnnotations: [new Annotation("version", 1)],
      } as GolemBaseCreate,
    ];

    const createReceipt = await client.createEntities(creates);
    console.log("GolemDB Receipt:", createReceipt);

    // Return a response
    return NextResponse.json(
      {
        message: "User data stored in GolemDB successfully!",
        data: body,
        receipt: createReceipt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling POST request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
