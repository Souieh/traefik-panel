# ============================================================
# Global configuration
# ============================================================

.ONESHELL:
SHELL := /bin/bash
.DEFAULT_GOAL := help

# ------------------------------------------------------------
# Project structure
# ------------------------------------------------------------

API_DIR := api
WEB_DIR := web

# ------------------------------------------------------------
# Runtime configuration (overrideable)
# ------------------------------------------------------------

API_HOST ?= 0.0.0.0
API_PORT ?= 8000

DEV_SESSION   := dev
SETUP_SESSION := setup

# ------------------------------------------------------------
# Commands
# ------------------------------------------------------------

API_CMD := \
	cd $(API_DIR) && \
	. .venv/bin/activate && \
	uvicorn main:app \
		--reload \
		--host $(API_HOST) \
		--port $(API_PORT)

WEB_CMD := \
	cd $(WEB_DIR) && \
	pnpm dev

API_SETUP_CMD := \
	cd $(API_DIR) && \
	python3 -m venv .venv && \
	. .venv/bin/activate && \
	pip install --upgrade pip && \
	pip install -r requirements.txt

WEB_SETUP_CMD := \
	cd $(WEB_DIR) && \
	corepack enable && \
	pnpm install

# ============================================================
# Phony targets
# ============================================================

.PHONY: \
	setup setup-api setup-web \
	run run-api run-web \
	kill-tmux \
	kill clean


# ============================================================
# Setup
# ============================================================

setup: setup-api setup-web

setup-api:
	@echo ">>> Setting up API"
	$(API_SETUP_CMD)

setup-web:
	@echo ">>> Setting up Web"
	$(WEB_SETUP_CMD)


# ============================================================
# Run (blocking)
# ============================================================

run-api:
	@echo ">>> Starting API"
	$(API_CMD)

run-web:
	@echo ">>> Starting Web"
	$(WEB_CMD)

run:
	@tmux has-session -t $(DEV_SESSION) 2>/dev/null || \
	tmux new-session -d -s $(DEV_SESSION) -n api \
		'echo "[API] starting on $(API_HOST):$(API_PORT)" && $(API_CMD)' \; \
		split-window -h \
		'echo "[WEB] starting dev server" && $(WEB_CMD)' \; \
		select-pane -t 0
	@tmux attach -t $(DEV_SESSION)

kill-tmux:
	@tmux kill-session -t $(DEV_SESSION) 2>/dev/null || true
	@echo "Killed tmux session: $(DEV_SESSION)"

# ============================================================
# Process cleanup
# ============================================================

kill:
	@echo ">>> Killing dev processes"
	@pkill -f uvicorn || true
	@pkill -f "pnpm dev" || true

clean:
	@echo ">>> Cleaning local artifacts"
	@rm -rf $(API_DIR)/.venv
	@rm -rf $(WEB_DIR)/node_modules
