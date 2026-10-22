# WebClaim

A one-page app that asks a GenLayer Intelligent Contract whether a public webpage supports a claim.

The contract fetches the page with `gl.nondet.web.render` and judges it with `gl.nondet.exec_prompt` inside `gl.eq_principle.prompt_comparative`. No off-chain model is used. The latest finalized verdict is stored on the contract.

This repository was not deployed from the machine that generated it. A Studio address below is blank until you deploy and test it yourself.

## Files

```text
contracts/web_claim.py   Intelligent Contract
frontend/                Wallet page (genlayer-js, Studionet chain 61999)
```

## Deploy the contract

1. Open [GenLayer Studio](https://studio.genlayer.com) (Studionet, chain id `61999`).
2. Paste `contracts/web_claim.py` into the editor.
3. Deploy with no constructor arguments.
4. Copy the contract address.

## Test in Studio before using the page

Call `verify`:

- claim: `This domain is for use in illustrative examples in documents.`
- source URL: `https://example.com/`

Wait until the transaction status is `FINALIZED`, then call `get_result`. A contradictory claim against the same page should not return `SUPPORTED`. An empty claim or a non-http URL must revert with `UserError` and leave the previous state unchanged.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Paste the Studio address, connect a wallet on Studionet, and submit. The page shows `pending` after the transaction is sent and `finalized` only after `waitForFinalization` reports success. It then reads `get_result` at `LATEST_FINAL`.

The page uses `genlayer-js@2.0.0-rc.2`. That release is the published package that matches the current docs (`studionet` chain id `61999`, `estimateTransactionFeesForWrite`, `waitForFinalization`). The default npm `latest` tag is still `1.1.8` and does not export those methods.

## GenLayer Projects checklist

No field-by-field submission form was found in the current developer docs. Builder contributions are reviewed through the [GenLayer portal](https://portal.genlayer.foundation/how-it-works). Before submitting, check:

- [ ] Contract source matches the deployed bytecode you are showing
- [ ] Studionet address and chain id `61999` are included
- [ ] A finalized `verify` transaction and the `get_result` output are included
- [ ] The negative and invalid-input cases above were actually run
- [ ] The writeup does not say the app is deployed if Studio deployment was not completed
- [ ] Repository link is public
