# Treasury Multicoin – Substrate-based Investment & Token Swap DAO

## Overview

**Treasury Multicoin** is a **Substrate-based treasury system** running on a **Solochain** that enables decentralized proposals for investments and token swaps.
The platform allows community members to:

* Create proposals for treasury investments.
* Propose and execute **token swaps**.
* Earn **Karma points** for profitable proposals.

Karma points act as a **reputation and reward system**, encouraging participants to make sound investment decisions that benefit the DAO.

---

## Features

* **Decentralized Treasury Management** – Manage multiple tokens in a single treasury.
* **Proposal System** – Create, vote, and finalize investment or token swap proposals.
* **Karma Rewards** – Gain reputation points for profitable decisions.
* **Token Swap Support** – Swap between supported tokens directly via the DAO.
* **On-chain Governance** – All decisions are made transparently via the blockchain.
* **Solochain Deployment** – Optimized for standalone Substrate chains.

---

## Tech Stack

* **Rust** – Core blockchain logic (pallet development in Substrate)
* **Substrate** – Framework for building the blockchain
* **Vite + TypeScript** – Fast and modern frontend tooling
* **React** – User interface for proposal management and voting
* **Polkadot.js API** – Wallet connection & on-chain interaction

---

## Project Structure

```
treasury-multicoin/
├── pallets/             # Custom Substrate pallets (treasury, proposals, karma)
├── runtime/             # Blockchain runtime configuration
├── node/                # Node implementation for the Solochain
├── frontend/            # React + Vite + TypeScript frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── README.md            # This file
```

---

## Getting Started

### 1️⃣ Prerequisites

* **Rust** (latest stable)
* **Substrate** development environment ([install guide](https://docs.substrate.io/install/))
* **Node.js** (>= 18)
* **Yarn** or **npm**

---

### 2️⃣ Clone the Repository

```bash
git clone https://github.com/your-org/substrate-multicoin-treasury.git
cd substrate-multicoin-treasury
```

---

### 3️⃣ Run the Blockchain Node

```bash
cd solochain
cargo build --release
./target/release/solochain-template-node -h

```

---

### 4️⃣ Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## How It Works

1. **Create Proposal**
   A user submits an investment or token swap proposal via the UI.
2. **Voting Phase**
   DAO members vote **For** or **Against** the proposal.
3. **Execution**
   If approved, the investment or swap is executed on-chain.
4. **Karma Points**
   If the proposal is approved, the proposer earns **Karma points**.

---

## 👥 Authors

* **\Branislav Stojkovic**
* **\Milos Cuturic**
* **\Nebojsa Vuga**

---
