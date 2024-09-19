// Import required modules
const express = require("express"); // Express framework for handling HTTP requests
const bodyParser = require("body-parser"); // Middleware for parsing request bodies
const crypto = require("crypto"); // Node.js crypto module for encryption and decryption
const _sodium = require("libsodium-wrappers");
const volleyball = require("volleyball");
const port = 3000; // Port on which the server will listen
const ENCRYPTION_PRIVATE_KEY =
  "MC4CAQAwBQYDK2VuBCIEIJB+WU+hBGAo2yUZo2TOJx8ymerXLFKw+AoT+pSiYolb";
const ONDC_PUBLIC_KEY =
  "MCowBQYDK2VuAyEAduMuZgmtpjdCuxv+Nc49K0cB6tL/Dj3HZetvVN7ZekM=";
const REQUEST_ID = "62e3fda55e04";
const SIGNING_PRIVATE_KEY =
  "s5cshCsc4G8agOp7MUNviL5irhP4uEZXlvM8+4fvl3GuGjj4rIAf23TI+8juHV20vt5lLU2TAUx+B+6YbyEVPA==";

const htmlFile = `
<!--Contents of ondc-site-verification.html. -->
<!--Please replace SIGNED_UNIQUE_REQ_ID with an actual value-->
<html>
  <head>
    <meta
      name="ondc-site-verification"
      content="SIGNED_UNIQUE_REQ_ID"
    />
  </head>
  <body>
    ONDC Site Verification Page
  </body>
</html>
`;
// Pre-defined public and private keys
const privateKey = crypto.createPrivateKey({
  key: Buffer.from(ENCRYPTION_PRIVATE_KEY, "base64"), // Decode private key from base64
  format: "der", // Specify the key format as DER
  type: "pkcs8", // Specify the key type as PKCS#8
});
const publicKey = crypto.createPublicKey({
  key: Buffer.from(ONDC_PUBLIC_KEY, "base64"), // Decode public key from base64
  format: "der", // Specify the key format as DER
  type: "spki", // Specify the key type as SubjectPublicKeyInfo (SPKI)
});

// Calculate the shared secret key using Diffie-Hellman
const sharedKey = crypto.diffieHellman({
  privateKey: privateKey,
  publicKey: publicKey,
});
// Create an Express application
const app = express();
app.use(volleyball);
app.use(bodyParser.json()); // Middleware to parse JSON request bodies

// Route for handling subscription requests
app.post("/on_subscribe", function (req, res) {
  const { challenge } = req.body; // Extract the 'challenge' property from the request body
  const answer = decryptAES256ECB(sharedKey, challenge); // Decrypt the challenge using AES-256-ECB
  const resp = { answer: answer };
  res.status(200).json(resp); // Send a JSON response with the answer
});

app.post("/on_search", (req, res) => {
  const { context, message } = req.body;

  // Log the callback response for debugging
  console.log("Received on_search callback:", req.body);

  // Validate the context and message
  if (context && message) {
    // Process the response (e.g., save to database, return products to user, etc.)
    console.log("Context:", context);
    console.log("Message:", message);

    // Send ACK response to the sender of the callback
    res.status(200).json({ status: "ACK" });
  } else {
    // Send NACK if the message or context is invalid
    res
      .status(400)
      .json({ status: "NACK", error: { type: "Validation", code: "40001" } });
  }
});

// Route for serving a verification file
app.get("/ondc-site-verification.html", async (req, res) => {
  const signedContent = await signMessage(REQUEST_ID, SIGNING_PRIVATE_KEY);
  // Replace the placeholder with the actual value
  const modifiedHTML = htmlFile.replace(/SIGNED_UNIQUE_REQ_ID/g, signedContent);
  // Send the modified HTML as the response
  res.send(modifiedHTML);
});

// Default route
app.get("/", (req, res) => res.send("Hello World!"));

// Health check route
app.get("/health", (req, res) => res.send("Health OK!!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// Decrypt using AES-256-ECB
function decryptAES256ECB(key, encrypted) {
  const iv = Buffer.alloc(0); // ECB doesn't use IV
  const decipher = crypto.createDecipheriv("aes-256-ecb", key, iv);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

async function signMessage(signingString, privateKey) {
  await _sodium.ready;
  const sodium = _sodium;
  const signedMessage = sodium.crypto_sign_detached(
    signingString,
    sodium.from_base64(privateKey, _sodium.base64_variants.ORIGINAL)
  );
  const signature = sodium.to_base64(
    signedMessage,
    _sodium.base64_variants.ORIGINAL
  );
  return signature;
}
