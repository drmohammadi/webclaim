import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionHashVariant, TransactionStatus } from "genlayer-js/types";

const addressEl = document.querySelector("#address");
const claimEl = document.querySelector("#claim");
const urlEl = document.querySelector("#url");
const walletEl = document.querySelector("#wallet");
const statusEl = document.querySelector("#status");
const errorEl = document.querySelector("#error");
const resultEl = document.querySelector("#result");

const stored = localStorage.getItem("webclaim.address");
if (stored) addressEl.value = stored;

let client = null;
let account = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function setError(text) {
  errorEl.textContent = text || "";
}

function contractAddress() {
  const address = addressEl.value.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error("Enter the deployed contract address from Studio.");
  }
  localStorage.setItem("webclaim.address", address);
  return address;
}

function inputs() {
  const claim = claimEl.value.trim();
  const sourceUrl = urlEl.value.trim();
  if (claim.length < 1 || claim.length > 500) {
    throw new Error("Claim must be 1 to 500 characters.");
  }
  if (
    sourceUrl.length > 400 ||
    !(sourceUrl.startsWith("https://") || sourceUrl.startsWith("http://")) ||
    /\s/.test(sourceUrl)
  ) {
    throw new Error("Source URL must be an http(s) URL with no spaces.");
  }
  return { claim, sourceUrl };
}

function showResult(value) {
  const data = value && typeof value === "object" ? value : {};
  resultEl.textContent = [
    `verdict: ${data.verdict || "(none)"}`,
    `explanation: ${data.explanation || ""}`,
    `claim: ${data.claim || ""}`,
    `source: ${data.source_url || ""}`,
  ].join("\n");
}

async function connect() {
  if (!window.ethereum) {
    throw new Error("No browser wallet found.");
  }
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  account = accounts[0];
  client = createClient({
    chain: studionet,
    account,
    provider: window.ethereum,
  });
  await client.connect("studionet");
  walletEl.textContent = account;
}

async function readSaved() {
  setError("");
  const address = contractAddress();
  if (!client) await connect();
  setStatus("reading saved state");
  const value = await client.readContract({
    address,
    functionName: "get_result",
    args: [],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  showResult(value);
  setStatus("finalized");
}

async function verify() {
  setError("");
  const address = contractAddress();
  const { claim, sourceUrl } = inputs();
  if (!client) await connect();

  setStatus("pending: waiting for wallet");
  const txId = await client.writeContract({
    address,
    functionName: "verify",
    args: [claim, sourceUrl],
    value: 0n,
  });
  setStatus(`pending: ${txId}`);
  const receipt = await client.waitForTransactionReceipt({
    hash: txId,
    status: TransactionStatus.FINALIZED,
    interval: 5000,
    retries: 120,
  });
  const execution = receipt?.txExecutionResultName;
  if (execution === "FINISHED_WITH_ERROR") {
    throw new Error("Contract execution failed.");
  }
  setStatus("finalized");
  await readSaved();
}

document.querySelector("#connect").addEventListener("click", () => {
  connect().catch((error) => {
    setStatus("error");
    setError(error.message || String(error));
  });
});

document.querySelector("#read").addEventListener("click", () => {
  readSaved().catch((error) => {
    setStatus("error");
    setError(error.message || String(error));
  });
});

document.querySelector("#submit").addEventListener("click", () => {
  verify().catch((error) => {
    setStatus("error");
    setError(error.message || String(error));
  });
});
