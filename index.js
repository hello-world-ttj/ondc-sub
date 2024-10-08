const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const _sodium = require("libsodium-wrappers");
const volleyball = require("volleyball");
const fs = require("fs");
const path = require("path");
const port = 3000;

const ENCRYPTION_PRIVATE_KEY =
  "MC4CAQAwBQYDK2VuBCIEIJB+WU+hBGAo2yUZo2TOJx8ymerXLFKw+AoT+pSiYolb";
const ONDC_PUBLIC_KEY =
  "MCowBQYDK2VuAyEAa9Wbpvd9SsrpOZFcynyt/TO3x0Yrqyys4NUGIvyxX2Q=";
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

const privateKey = crypto.createPrivateKey({
  key: Buffer.from(ENCRYPTION_PRIVATE_KEY, "base64"),
  format: "der",
  type: "pkcs8",
});
const publicKey = crypto.createPublicKey({
  key: Buffer.from(ONDC_PUBLIC_KEY, "base64"),
  format: "der",
  type: "spki",
});

// Calculate the shared secret key using Diffie-Hellman
const sharedKey = crypto.diffieHellman({
  privateKey: privateKey,
  publicKey: publicKey,
});

const app = express();
app.use(volleyball);
app.use(bodyParser.json({ limit: "10mb" })); // Increase the request body size limit

app.post("/on_subscribe", function (req, res) {
  const { challenge } = req.body;
  const answer = decryptAES256ECB(sharedKey, challenge);
  res.status(200).json({ answer });
});

app.post("/on_search", (req, res) => {
  try {
    const logFilePath = path.join(__dirname, "search_log.txt");

    // Convert req.body to a string for logging
    const logData = `Received on_search callback: ${JSON.stringify(
      req.body,
      null,
      2
    )}\n`;

    // Append the log data to the file
    fs.appendFile(logFilePath, logData, (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      } else {
        console.log("Log saved to search_log.txt");
      }
    });

    // Additional console logs
    console.log("Received on_search callback:", req.body.message);
    console.log("", req.body.message.catalog["bpp/providers"]);
  } catch (error) {
    console.log("Error in on_search callback:", error);
  }
  res.sendStatus(200);
});

app.post("/on_select", (req, res) => {
  try {
    const logDir = __dirname; // The directory where logs will be stored

    // Function to get the next file number for naming
    const getNextLogFileName = () => {
      const files = fs.readdirSync(logDir); // Get all files in the directory
      const logFiles = files.filter(
        (file) => file.startsWith("select_log_") && file.endsWith(".txt")
      );

      if (logFiles.length === 0) {
        return "select_log_1.txt"; // First log file
      }

      const fileNumbers = logFiles.map((file) =>
        parseInt(file.match(/select_log_(\d+)\.txt/)[1])
      );

      const maxNumber = Math.max(...fileNumbers);
      return `select_log_${maxNumber + 1}.txt`; // Increment the number
    };

    const logFilePath = path.join(logDir, getNextLogFileName());

    // Convert req.body to a string for logging
    const logData = `Received on_select callback: ${JSON.stringify(
      req.body,
      null,
      2
    )}\n`;

    // Append the log data to the new file
    fs.writeFile(logFilePath, logData, (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      } else {
        console.log(`Log saved to ${logFilePath}`);
      }
    });

    // Additional console logs
    console.log("Received on_select body:", req.body);
    console.log("Received on_select callback:", req.body.message.order);
    console.log(
      "Received on_select callback:",
      req.body.message.order.fulfillments[0].state
    );
  } catch (error) {
    console.log("Error in on_select callback:", error);
  }
  res.sendStatus(200);
});

app.post("/on_init", (req, res) => {
  try {
    const logDir = __dirname; // The directory where logs will be stored

    // Function to get the next file number for naming
    const getNextLogFileName = () => {
      const files = fs.readdirSync(logDir); // Get all files in the directory
      const logFiles = files.filter(
        (file) => file.startsWith("init_log_") && file.endsWith(".txt")
      );

      if (logFiles.length === 0) {
        return "init_log_1.txt"; // First log file
      }

      const fileNumbers = logFiles.map((file) =>
        parseInt(file.match(/init_log_(\d+)\.txt/)[1])
      );

      const maxNumber = Math.max(...fileNumbers);
      return `init_log_${maxNumber + 1}.txt`; // Increment the number
    };

    const logFilePath = path.join(logDir, getNextLogFileName());

    // Convert req.body to a string for logging
    const logData = `Received on_init callback: ${JSON.stringify(
      req.body,
      null,
      2
    )}\n`;

    // Append the log data to the new file
    fs.writeFile(logFilePath, logData, (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      } else {
        console.log(`Log saved to ${logFilePath}`);
      }
    });

    // Additional console logs
    console.log("Received on_init body:", req.body);
    console.log("Received on_init callback:", req.body.message.order);
    console.log(
      "Received on_init callback:",
      req.body.message.order.fulfillments[0].state
    );
  } catch (error) {
    console.log("Error in on_init callback:", error);
  }
  res.sendStatus(200);
});

app.post("/on_confirm", (req, res) => {
  try {
    const logDir = __dirname; // The directory where logs will be stored

    // Function to get the next file number for naming
    const getNextLogFileName = () => {
      const files = fs.readdirSync(logDir); // Get all files in the directory
      const logFiles = files.filter(
        (file) => file.startsWith("confirm_log_") && file.endsWith(".txt")
      );

      if (logFiles.length === 0) {
        return "confirm_log_.txt"; // First log file
      }

      const fileNumbers = logFiles.map((file) =>
        parseInt(file.match(/confirm_log_(\d+)\.txt/)[1])
      );

      const maxNumber = Math.max(...fileNumbers);
      return `confirm_log_${maxNumber + 1}.txt`; // Increment the number
    };

    const logFilePath = path.join(logDir, getNextLogFileName());

    // Convert req.body to a string for logging
    const logData = `Received on_confirm callback: ${JSON.stringify(
      req.body,
      null,
      2
    )}\n`;

    // Append the log data to the new file
    fs.writeFile(logFilePath, logData, (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      } else {
        console.log(`Log saved to ${logFilePath}`);
      }
    });

    // Additional console logs
    console.log("Received on_confirm body:", req.body);
    console.log("Received on_confirm callback:", req.body.message.order);
    console.log(
      "Received on_confirm callback:",
      req.body.message.order.fulfillments[0].state
    );
  } catch (error) {
    console.log("Error in on_confirm callback:", error);
  }
  res.sendStatus(200);
});

app.post("/on_status", (req, res) => {
  try {
    const logDir = __dirname; // The directory where logs will be stored

    // Function to get the next file number for naming
    const getNextLogFileName = () => {
      const files = fs.readdirSync(logDir); // Get all files in the directory
      const logFiles = files.filter(
        (file) => file.startsWith("status_log_") && file.endsWith(".txt")
      );

      if (logFiles.length === 0) {
        return "status_log_.txt"; // First log file
      }

      const fileNumbers = logFiles.map((file) =>
        parseInt(file.match(/status_log_(\d+)\.txt/)[1])
      );

      const maxNumber = Math.max(...fileNumbers);
      return `status_log_${maxNumber + 1}.txt`; // Increment the number
    };

    const logFilePath = path.join(logDir, getNextLogFileName());

    // Convert req.body to a string for logging
    const logData = `Received on_status callback: ${JSON.stringify(
      req.body,
      null,
      2
    )}\n`;

    // Append the log data to the new file
    fs.writeFile(logFilePath, logData, (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      } else {
        console.log(`Log saved to ${logFilePath}`);
      }
    });

    // Additional console logs
    console.log("Received on_status body:", req.body);
    console.log("Received on_status callback:", req.body.message.order);
    console.log(
      "Received on_status callback:",
      req.body.message.order.fulfillments[0].state
    );
  } catch (error) {
    console.log("Error in on_status callback:", error);
  }
  res.sendStatus(200);
});

app.post("/on_cancel", (req, res) => {
  try {
    const logDir = __dirname; // The directory where logs will be stored

    // Function to get the next file number for naming
    const getNextLogFileName = () => {
      const files = fs.readdirSync(logDir); // Get all files in the directory
      const logFiles = files.filter(
        (file) => file.startsWith("cancel_log_") && file.endsWith(".txt")
      );

      if (logFiles.length === 0) {
        return "cancel_log_.txt"; // First log file
      }

      const fileNumbers = logFiles.map((file) =>
        parseInt(file.match(/cancel_log_(\d+)\.txt/)[1])
      );

      const maxNumber = Math.max(...fileNumbers);
      return `cancel_log_${maxNumber + 1}.txt`; // Increment the number
    };

    const logFilePath = path.join(logDir, getNextLogFileName());

    // Convert req.body to a string for logging
    const logData = `Received on_cancel callback: ${JSON.stringify(
      req.body,
      null,
      2
    )}\n`;

    // Append the log data to the new file
    fs.writeFile(logFilePath, logData, (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      } else {
        console.log(`Log saved to ${logFilePath}`);
      }
    });

    // Additional console logs
    console.log("Received on_cancel body:", req.body);
    console.log("Received on_cancel callback:", req.body.message.order);
    console.log(
      "Received on_cancel callback:",
      req.body.message.order.fulfillments[0].state
    );
  } catch (error) {
    console.log("Error in on_cancel callback:", error);
  }
  res.sendStatus(200);
});

app.get("/ondc-site-verification.html", async (req, res) => {
  const signedContent = await signMessage(REQUEST_ID, SIGNING_PRIVATE_KEY);
  const modifiedHTML = htmlFile.replace(/SIGNED_UNIQUE_REQ_ID/g, signedContent);
  res.send(modifiedHTML);
});

app.get("/", (req, res) => res.send("Hello World!"));
app.get("/health", (req, res) => res.send("Health OK!!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

function decryptAES256ECB(key, encrypted) {
  const iv = Buffer.alloc(0);
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
  return sodium.to_base64(signedMessage, _sodium.base64_variants.ORIGINAL);
}
