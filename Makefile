# -------- Config --------
TOOLCHAIN ?= 1.86.0
BIN       ?= solochain-template-node
PROFILE   ?= release
BASE_PATH ?= ./my-chain-state
FEATURES  ?=
CARGO     ?= cargo
RUSTUP    ?= rustup

TARGET_PATH := ./target/$(PROFILE)/$(BIN)

# -------- Phony --------
.PHONY: help init build rebuild run-dev run-dev-debug run-dev-persist purge-dev check fmt clippy test clean doc

help:
	@echo "Substrate Solochain Template Make targets:"
	@echo "  make init             - Install wasm target (+ rust-src) for toolchain $(TOOLCHAIN)"
	@echo "  make build            - cargo build --release"
	@echo "  make rebuild          - clean + build"
	@echo "  make run-dev          - run single-node dev (ephemeral state)"
	@echo "  make run-dev-debug    - run dev with -ldebug and RUST_BACKTRACE=1"
	@echo "  make run-dev-persist  - run dev with --base-path=$(BASE_PATH)"
	@echo "  make purge-dev        - purge local dev chain state"
	@echo "  make check            - cargo check (fast compile check)"
	@echo "  make fmt              - cargo fmt --all"
	@echo "  make clippy           - cargo clippy -- -D warnings"
	@echo "  make test             - cargo test --all"
	@echo "  make clean            - cargo clean"
	@echo "  make doc              - cargo +nightly doc --open (optional)"

init:
	$(RUSTUP) target add wasm32-unknown-unknown --toolchain $(TOOLCHAIN)
	$(RUSTUP) component add rust-src --toolchain $(TOOLCHAIN)
	@echo "✅ wasm32-unknown-unknown & rust-src ready for $(TOOLCHAIN)"

build:
	$(CARGO) build --$(PROFILE) $(if $(FEATURES),--features "$(FEATURES)",)

rebuild: clean build

run-dev: build
	$(TARGET_PATH) --dev

run-dev-debug: build
	RUST_BACKTRACE=1 $(TARGET_PATH) -ldebug --dev

run-dev-persist: build
	@mkdir -p $(BASE_PATH)
	$(TARGET_PATH) --dev --base-path $(BASE_PATH)

purge-dev:
	$(TARGET_PATH) purge-chain --dev -y || true
	@echo "🧹 Purged dev chain state."

check:
	$(CARGO) check

fmt:
	$(CARGO) fmt --all

clippy:
	$(CARGO) clippy --all-targets --all-features -- -D warnings

test:
	$(CARGO) test --all

clean:
	$(CARGO) clean

# Optional: README kaže da je za docs potreban nightly
doc:
	cargo +nightly doc --open
