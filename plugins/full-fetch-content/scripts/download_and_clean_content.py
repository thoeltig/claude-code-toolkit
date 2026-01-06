#!/usr/bin/env python3
"""
Download and clean HTML content.

Downloads HTML pages from provided URLs, removes navigation/footer/scripts,
and saves cleaned HTML to files. Returns list of file paths.
"""

import argparse
import sys
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
MIN_CONTENT_LINES_THRESHOLD = 10


class HTMLDownloader:
    """Downloads and cleans HTML content."""

    def __init__(self, timeout: int = DEFAULT_TIMEOUT_SECONDS, user_agent: Optional[str] = None):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': user_agent or DEFAULT_USER_AGENT})

    def download_html(self, url: str) -> Optional[str]:
        """Download HTML content from URL."""
        try:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            return response.text
        except requests.RequestException:
            return None

    def download_html_with_js(self, url: str) -> Optional[str]:
        """Download HTML content with JavaScript execution using Playwright."""
        if not PLAYWRIGHT_AVAILABLE:
            return None

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()

                # Block resource types to speed up loading
                def handle_route(route):
                    resource_type = route.request.resource_type
                    if resource_type in ['image', 'stylesheet', 'media', 'font', 'xhr', 'fetch']:
                        route.abort()
                    else:
                        route.continue_()

                page.route('**/*', handle_route)
                page.goto(url, wait_until='networkidle', timeout=self.timeout * 1000)
                html = page.content()
                browser.close()
                return html
        except Exception:
            return None

    def clean_html(self, html: str) -> str:
        """Remove navigation, footer, scripts, and interactive elements."""
        soup = BeautifulSoup(html, 'html.parser')

        # Remove unwanted tags
        for tag in ['script', 'style', 'nav', 'header', 'footer', 'aside',
                    'img', 'svg', 'picture', 'video', 'audio', 'iframe',
                    'button', 'input', 'select', 'textarea', 'form']:
            for element in soup.find_all(tag):
                element.decompose()

        # Remove elements by ID/class patterns
        patterns = [
            'nav', 'navigation', 'navbar', 'menu', 'sidebar', 'breadcrumb', 'search',
            'social', 'share', 'cookie', 'cookiebot', 'banner', 'advertisement', 'popup',
            'table-of-content', 'toc', 'feedback', 'pagination', 'paging', 'chat',
            'scroll-', '-scroll', '-slide', 'slide-', '-arrow', 'arrow-'
        ]
        for pattern in patterns:
            for element in soup.find_all(id=lambda x: x and pattern in x.lower()):
                element.decompose()
            for element in soup.find_all(class_=lambda x: x and isinstance(x, list) and any(pattern in cls.lower() for cls in x)):
                element.decompose()

        # Remove elements with aria-label indicating navigation
        for element in soup.find_all(attrs={"aria-label": lambda x: x and any(term in x.lower() for term in ['navigation', 'menu', 'breadcrumb', 'social', 'search'])}):
            element.decompose()

        # Remove data attributes for navigation
        for element in soup.find_all(attrs={"data-title": True}):
            element.decompose()

        for element in soup.find_all(attrs={"data-is-opaque": True}):
            element.decompose()

        for element in soup.find_all(attrs={"role": "region"}):
            element.decompose()

        # Return body or full soup
        body = soup.find('body')
        return str(body) if body else str(soup)

    def html_to_markdown(self, html: str) -> str:
        """Convert cleaned HTML to Markdown."""
        markdown = md(html, heading_style='ATX', bullets='-', code_language='', strip=['a'])
        # Clean up excessive newlines
        while '\n\n\n' in markdown:
            markdown = markdown.replace('\n\n\n', '\n\n')
        return markdown.strip()

    def generate_filename(self, url: str) -> str:
        """Generate filename from URL in format: domain_resource.md"""
        parsed = urlparse(url)
        domain = parsed.netloc.replace('www.', '').replace('.', '-').lower()
        path = parsed.path.strip('/')
        resource = path.split('/')[-1] if path else 'index'
        if '.' in resource:
            resource = resource.rsplit('.', 1)[0]
        resource = resource.replace(' ', '-').lower()
        if not resource:
            resource = 'index'
        return f"{domain}_{resource}.md"


class URLProcessor:
    """Process URLs and return file paths."""

    def __init__(self, downloader: HTMLDownloader):
        self.downloader = downloader

    def process_urls(self, urls: List[str], output_folder: Path) -> List[str]:
        """Process multiple URLs and return list of saved file paths."""
        output_folder.mkdir(parents=True, exist_ok=True)
        saved_files = []

        for url in urls:
            file_path = self._process_single_url(url, output_folder)
            if file_path:
                saved_files.append(file_path)

        return saved_files

    def _process_single_url(self, url: str, output_folder: Path) -> Optional[str]:
        """Process a single URL and return file path or None."""
        # Download with static fetch first
        html = self.downloader.download_html(url)
        if not html:
            return None

        # Clean HTML
        cleaned_html = self.downloader.clean_html(html)

        # Check if content is too short - likely JS-rendered
        text_length = len(cleaned_html.strip())
        if text_length < 500 and PLAYWRIGHT_AVAILABLE:
            # Retry with JavaScript rendering
            html = self.downloader.download_html_with_js(url)
            if html:
                cleaned_html = self.downloader.clean_html(html)

        # Convert to markdown
        markdown = self.downloader.html_to_markdown(cleaned_html)

        # Generate filename and save
        filename = self.downloader.generate_filename(url)
        filepath = output_folder / filename
        filepath.write_text(markdown, encoding='utf-8')

        return str(filepath)


def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='Download and clean HTML content',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python download_full_content.py https://example.com/page
  python download_full_content.py -f output https://example.com/page1 https://example.com/page2
  python download_full_content.py -f docs --url-file urls.txt
        """
    )

    parser.add_argument('urls', nargs='*', help='URLs to download (can provide multiple)')
    parser.add_argument('-f', '--folder', type=str, default='output', help='Output folder (default: output)')
    parser.add_argument('--url-file', type=str, help='File containing URLs (one per line)')
    parser.add_argument('--timeout', type=int, default=DEFAULT_TIMEOUT_SECONDS, help=f'Request timeout in seconds (default: {DEFAULT_TIMEOUT_SECONDS})')

    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_arguments()

    # Collect URLs
    urls = list(args.urls) if args.urls else []

    if args.url_file:
        try:
            with open(args.url_file, 'r', encoding='utf-8') as f:
                file_urls = [line.strip() for line in f if line.strip()]
                urls.extend(file_urls)
        except Exception as e:
            print(f"Error reading URL file: {e}", file=sys.stderr)
            sys.exit(1)

    if not urls:
        print("Error: No URLs provided. Use positional arguments or --url-file", file=sys.stderr)
        sys.exit(1)

    output_folder = Path(args.folder)

    # Process URLs
    downloader = HTMLDownloader(timeout=args.timeout)
    processor = URLProcessor(downloader)
    saved_files = processor.process_urls(urls, output_folder)

    # Print results
    for file_path in saved_files:
        print(file_path)

    # Exit with error if none succeeded
    sys.exit(0 if saved_files else 1)


if __name__ == '__main__':
    main()
