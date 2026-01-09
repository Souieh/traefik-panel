
.PHONY: install run

install:
	.venv/bin/pip install -r requirements.txt

run:
	.venv/bin/uvicorn main:app --reload	 --host 0.0.0.0 --port 8000