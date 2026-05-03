FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY app/backend/requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt

COPY app /app/app

RUN useradd --create-home --uid 1000 kinesis \
    && chown -R kinesis:kinesis /app
USER kinesis

EXPOSE 5001 5002

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5001", "app.backend.app:app"]
