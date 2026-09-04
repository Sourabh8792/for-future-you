#!/usr/bin/env python3

from pathlib import Path
import shutil
import subprocess

from PIL import Image
from pypdf import PdfReader
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


SITE_URL = "https://sourabh8792.github.io/for-future-you/"

TRIM_WIDTH = 105 * mm
TRIM_HEIGHT = 148 * mm
BLEED = 3 * mm
PAGE_WIDTH = TRIM_WIDTH + 2 * BLEED
PAGE_HEIGHT = TRIM_HEIGHT + 2 * BLEED

BACKGROUND = colors.HexColor("#F3EDE2")
TEXT = colors.HexColor("#24211D")
ACCENT = colors.HexColor("#B85C3F")
MUTED = colors.HexColor("#6D655D")

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = PROJECT_ROOT / "output" / "pdf"
TMP_DIR = PROJECT_ROOT / "tmp" / "pdfs"
PDF_PATH = OUTPUT_DIR / "for-future-you-a6-card.pdf"
FRONT_PREVIEW = OUTPUT_DIR / "for-future-you-a6-front.png"
BACK_PREVIEW = OUTPUT_DIR / "for-future-you-a6-back.png"


def draw_background(pdf: canvas.Canvas) -> None:
    pdf.setFillColor(BACKGROUND)
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, stroke=0, fill=1)


def draw_crop_marks(pdf: canvas.Canvas) -> None:
    left = BLEED
    right = BLEED + TRIM_WIDTH
    bottom = BLEED
    top = BLEED + TRIM_HEIGHT
    gap = 0.6 * mm

    pdf.saveState()
    pdf.setStrokeColor(colors.black)
    pdf.setLineWidth(0.25)

    for y in (bottom, top):
        pdf.line(0, y, left - gap, y)
        pdf.line(right + gap, y, PAGE_WIDTH, y)

    for x in (left, right):
        pdf.line(x, 0, x, bottom - gap)
        pdf.line(x, top + gap, x, PAGE_HEIGHT)

    pdf.restoreState()


def draw_front(pdf: canvas.Canvas) -> None:
    draw_background(pdf)
    center_x = PAGE_WIDTH / 2
    center_y = PAGE_HEIGHT / 2

    pdf.setFillColor(TEXT)
    pdf.setFont("Helvetica-Bold", 19)
    pdf.drawCentredString(center_x, center_y + 8 * mm, "A small gift for your future.")

    pdf.setFillColor(ACCENT)
    pdf.setFont("Helvetica", 14)
    pdf.drawCentredString(center_x, center_y - 4 * mm, "Stay curious.")

    draw_crop_marks(pdf)
    pdf.showPage()


def qr_drawing(size: float) -> Drawing:
    widget = QrCodeWidget(
        SITE_URL,
        barLevel="Q",
        barBorder=4,
        barFillColor=TEXT,
    )
    x1, y1, x2, y2 = widget.getBounds()
    width = x2 - x1
    height = y2 - y1
    scale = min(size / width, size / height)
    drawing = Drawing(size, size, transform=[scale, 0, 0, scale, 0, 0])
    drawing.add(widget)
    return drawing


def draw_back(pdf: canvas.Canvas) -> None:
    draw_background(pdf)
    center_x = PAGE_WIDTH / 2

    pdf.setFillColor(TEXT)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawCentredString(center_x, PAGE_HEIGHT - BLEED - 27 * mm, "Scan to open your gift.")

    qr_size = 44 * mm
    qr_x = center_x - qr_size / 2
    qr_y = PAGE_HEIGHT / 2 - qr_size / 2 + 2 * mm

    pdf.setFillColor(colors.white)
    pdf.roundRect(qr_x - 2 * mm, qr_y - 2 * mm, qr_size + 4 * mm, qr_size + 4 * mm, 2 * mm, stroke=0, fill=1)
    renderPDF.draw(qr_drawing(qr_size), pdf, qr_x, qr_y)

    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 7.5)
    pdf.drawCentredString(center_x, BLEED + 24 * mm, SITE_URL)

    draw_crop_marks(pdf)
    pdf.showPage()


def generate_pdf() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(PDF_PATH), pagesize=(PAGE_WIDTH, PAGE_HEIGHT), pageCompression=1)
    pdf.setTitle("For Future You - A6 Card")
    pdf.setSubject("Front and back print-ready A6 card with 3 mm bleed")
    pdf.setAuthor("Sourabh Patravale")
    draw_front(pdf)
    draw_back(pdf)
    pdf.save()


def verify_pdf() -> None:
    reader = PdfReader(str(PDF_PATH))
    if len(reader.pages) != 2:
        raise RuntimeError(f"Expected 2 pages, found {len(reader.pages)}")

    expected_width = PAGE_WIDTH
    expected_height = PAGE_HEIGHT
    for page in reader.pages:
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        if abs(width - expected_width) > 0.5 or abs(height - expected_height) > 0.5:
            raise RuntimeError(f"Unexpected page size: {width} x {height} points")


def render_previews() -> None:
    pdftoppm = shutil.which("pdftoppm")
    if not pdftoppm:
        raise RuntimeError("pdftoppm was not found on PATH")

    TMP_DIR.mkdir(parents=True, exist_ok=True)
    prefix = TMP_DIR / "card"
    subprocess.run(
        [pdftoppm, "-png", "-r", "300", str(PDF_PATH), str(prefix)],
        check=True,
        capture_output=True,
        text=True,
    )

    bleed_pixels = round(3 / 25.4 * 300)
    for source, target in (
        (TMP_DIR / "card-1.png", FRONT_PREVIEW),
        (TMP_DIR / "card-2.png", BACK_PREVIEW),
    ):
        with Image.open(source) as image:
            crop = (
                bleed_pixels,
                bleed_pixels,
                image.width - bleed_pixels,
                image.height - bleed_pixels,
            )
            image.crop(crop).save(target, dpi=(300, 300))


def verify_qr() -> None:
    try:
        import zxingcpp
    except ImportError as error:
        raise RuntimeError("zxing-cpp is required for the automated QR decoding test") from error

    with Image.open(BACK_PREVIEW) as image:
        result = zxingcpp.read_barcode(image)
    if not result or result.text != SITE_URL:
        decoded = result.text if result else None
        raise RuntimeError(f"QR decode failed. Expected {SITE_URL!r}, got {decoded!r}")


def main() -> None:
    generate_pdf()
    verify_pdf()
    render_previews()
    verify_qr()
    print(PDF_PATH)
    print(FRONT_PREVIEW)
    print(BACK_PREVIEW)


if __name__ == "__main__":
    main()
