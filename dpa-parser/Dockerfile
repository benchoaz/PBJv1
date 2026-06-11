FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for PyMuPDF and PaddleOCR
RUN apt-get update && apt-get install -y \
    libmupdf-dev \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

COPY main.py rak_parser.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
