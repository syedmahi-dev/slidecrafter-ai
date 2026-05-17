import sys
import json
import os
from tempfile import NamedTemporaryFile

# Add parent directory to path so we can import engines.python.engine
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from engine import build_presentation

def main():
    if len(sys.argv) < 2:
        print("Usage: build-from-json.py <path-to-json-file>")
        sys.exit(1)

    json_file = sys.argv[1]
    with open(json_file, 'r', encoding='utf-8') as f:
        slide_data = json.load(f)

    # Use a temp directory for output to avoid clutter
    output_dir = os.path.join(os.path.dirname(__file__), 'temp_output')
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate random filename
    import uuid
    filename = f"presentation_{uuid.uuid4().hex[:8]}"

    out_path = build_presentation(slide_data, output_dir, filename)
    print(out_path)

if __name__ == '__main__':
    main()
