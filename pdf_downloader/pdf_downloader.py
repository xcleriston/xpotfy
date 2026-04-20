import requests
from bs4 import BeautifulSoup
import os
import re
from urllib.parse import urljoin, urlparse, urlsplit
import urllib.request
from io import StringIO
import time
import random

def get_all_links_from_page(url, headers, visited, max_pages=50):
    """Recursively collects all links from the page and subpages"""
    if url in visited or len(visited) >= max_pages:
        return set()

    visited.add(url)
    print(f"Crawling: {url}")

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error accessing {url}: {e}")
        return set()

    soup = BeautifulSoup(response.text, 'html.parser')
    links = set()

    # Find all <a> tags
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        full_url = urljoin(url, href)
        parsed_url = urlparse(full_url)

        # Filter only URLs from the same domain
        if parsed_url.netloc == urlparse(url).netloc:
            links.add(full_url)

    return links

def extract_pdf_links(html_content, base_url):
    """Extracts PDF links from HTML"""
    soup = BeautifulSoup(html_content, 'html.parser')
    pdf_links = set()

    # 1. Direct PDF links in <a> tags
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href'].lower()
        if href.endswith('.pdf'):
            full_url = urljoin(base_url, href)
            pdf_links.add(full_url)

    # 2. Check for PDFs in iframes
    for iframe in soup.find_all('iframe', src=True):
        src = iframe['src'].lower()
        if src.endswith('.pdf'):
            full_url = urljoin(base_url, src)
            pdf_links.add(full_url)

    return pdf_links

def download_pdfs_comprehensive(url, save_folder, max_pages=50, delay=1):
    """
    Comprehensive PDF download from the website, including subpages
    """
    # Create destination folder
    if not os.path.exists(save_folder):
        os.makedirs(save_folder)

    # Headers to simulate browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    # Sets to track visited pages and unique PDFs
    visited_pages = set()
    all_pdf_links = set()

    print("Starting website crawl...")

    # Initial crawl of the main page
    initial_links = get_all_links_from_page(url, headers, visited_pages, max_pages)
    pages_to_visit = {url} | initial_links

    # Process each page
    for page_url in pages_to_visit:
        if page_url in visited_pages:
            continue

        print(f"\nProcessing page: {page_url}")

        try:
            response = requests.get(page_url, headers=headers, timeout=10)
            response.raise_for_status()

            # Extract PDF links from HTML
            page_pdfs = extract_pdf_links(response.text, page_url)
            all_pdf_links.update(page_pdfs)
            print(f"PDFs found on page: {len(page_pdfs)} (total: {len(all_pdf_links)})")

            # Small delay to avoid server overload
            time.sleep(random.uniform(delay * 0.5, delay * 1.5))

        except requests.exceptions.RequestException as e:
            print(f"Error processing page {page_url}: {e}")
            continue

    print(f"\nTotal unique PDFs found: {len(all_pdf_links)}")

    if not all_pdf_links:
        print("No PDFs found.")
        return

    # Download PDFs
    downloaded_count = 0
    failed_downloads = 0

    for pdf_url in all_pdf_links:
        # Get filename from URL
        parsed_url = urlparse(pdf_url)
        pdf_name = os.path.basename(parsed_url.path)

        # Ensure it's a PDF
        if not pdf_name.lower().endswith('.pdf'):
            pdf_name += '.pdf'

        # Avoid duplicate filenames
        base, ext = os.path.splitext(pdf_name)
        counter = 1
        original_name = pdf_name
        while os.path.exists(os.path.join(save_folder, pdf_name)):
            pdf_name = f"{base}_{counter}{ext}"
            counter += 1

        pdf_path = os.path.join(save_folder, pdf_name)

        # Download
        try:
            pdf_response = requests.get(pdf_url, headers=headers, stream=True, timeout=30)
            pdf_response.raise_for_status()

            # Check content type
            content_type = pdf_response.headers.get('content-type', '').lower()
            if 'pdf' not in content_type and 'octet-stream' not in content_type:
                print(f"Skipping {pdf_url} (not a PDF: {content_type})")
                continue

            with open(pdf_path, 'wb') as f:
                for chunk in pdf_response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            file_size = os.path.getsize(pdf_path) / 1024  # Size in KB
            print(f"✓ Downloaded: {pdf_name} ({file_size:.1f} KB)")
            downloaded_count += 1

        except Exception as e:
            print(f"✗ Error downloading {pdf_url}: {e}")
            failed_downloads += 1
            # Remove partially downloaded file if it exists
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

    print(f"\n=== SUMMARY ===")
    print(f"PDFs found: {len(all_pdf_links)}")
    print(f"Successfully downloaded: {downloaded_count}")
    print(f"Failed downloads: {failed_downloads}")
    print(f"Destination folder: {os.path.abspath(save_folder)}")

if __name__ == "__main__":
    # Configuration
    target_url = input("Enter the website URL to scan for PDFs: ") or "https://www.example.com"
    output_folder = "downloaded_pdfs"
    max_pages_to_crawl = 100  # Adjust as needed
    delay_between_requests = 1.0  # Seconds

    download_pdfs_comprehensive(target_url, output_folder, max_pages_to_crawl, delay_between_requests)
