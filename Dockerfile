FROM debian:bookworm-slim

WORKDIR /app

# 1. Install Python, web framework, and XML/image dependencies directly from Debian
# (Debian packages are pre-compiled for generic x86-64 CPUs without AVX2 requirements)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-fastapi \
    python3-uvicorn \
    python3-lxml \
    python3-pil \
    python3-cssutils \
    python3-multipart \
    python3-jinja2 \
    python3-aiofiles \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 2. Filter out C-extension packages from requirements.txt so pip does NOT pull AVX2 PyPI wheels
RUN grep -i -v -E "lxml|pillow|uvloop|httptools" requirements.txt > req_safe.txt && \
    pip install --no-cache-dir --break-system-packages -r req_safe.txt

COPY . .

RUN mkdir -p tmp/uploads tmp/outputs

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
