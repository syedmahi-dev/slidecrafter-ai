#!/usr/bin/env python3
# cli/generate.py

import argparse
import os
import re
import sys

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

from agents.content_agent import generate_slide_content
from engines.python.engine import build_presentation


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')


def main():
    parser = argparse.ArgumentParser(description='Gemini-powered PowerPoint generator (Python engine)')
    parser.add_argument('--topic', required=True, help='Presentation topic')
    parser.add_argument('--slides', type=int, default=8, help='Number of slides (default: 8)')
    parser.add_argument('--template', default='business', help='Template style: business | technical | minimal')
    parser.add_argument('--output', default=os.getenv('OUTPUT_DIR', './output'), help='Output directory')
    args = parser.parse_args()

    if not os.getenv('GEMINI_API_KEY'):
        print('❌  GEMINI_API_KEY not found in .env')
        sys.exit(1)

    print(f'\n🤖 Generating content for: "{args.topic}" ({args.slides} slides)...')

    try:
        slide_data = generate_slide_content(topic=args.topic, slide_count=args.slides, template=args.template)
        print(f'✅ Gemini returned {len(slide_data["slides"])} slides')
    except Exception as e:
        print(f'❌ Content generation failed: {e}')
        sys.exit(1)

    filename = slugify(args.topic)
    print(f'🛠  Building presentation (python-pptx engine)...')

    try:
        out_path = build_presentation(slide_data=slide_data, output_dir=args.output, filename=filename)
        print(f'\n✅ Done! Saved to: {out_path}\n')
    except Exception as e:
        print(f'❌ Build failed: {e}')
        sys.exit(1)


if __name__ == '__main__':
    main()
