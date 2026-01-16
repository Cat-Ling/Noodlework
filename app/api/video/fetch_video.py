#!/usr/bin/env python3
import requests
import re
import json
import sys

def get_video_info(video_id):
    url = f"https://mat6tube.com/watch/{video_id}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.3029.110 Safari/537.36'
    }
    
    session = requests.Session()
    session.headers.update(headers)
    
    try:
        response = session.get(url)
        page_content = response.text
        
        # Extract Cookies
        cookies = session.cookies.get_dict()
        cookie_string = "; ".join([f"{key}={value}" for key, value in cookies.items()])
        
        # Extract Metadata
        title_match = re.search(r'<title>(.+?)</title>', page_content)
        title = title_match.group(1).replace(' watch online', '') if title_match else "Unknown Title"
        
        # Extract Thumbnail (og:image)
        thumbnail_match = re.search(r'property="og:image" content="([^"]+)"', page_content)
        thumbnail = thumbnail_match.group(1) if thumbnail_match else ""
        
        # Extract Playlist
        sources = []
        tracks = []
        
        playlist_match = re.search(r'window\.playlist = ({.*?});', page_content)
        if playlist_match:
            try:
                playlist_json = playlist_match.group(1)
                # Fix JS object to valid JSON (simple replacements for booleans)
                playlist_json = playlist_json.replace('true', 'true').replace('false', 'false')
                # But eval is safer for loose JS objects if we trust source, or we can use generic json loader with leniency?
                # NoodleMat-DL uses eval. We'll use eval but be careful.
                # Actually, standard JSON parser might fail on unquoted keys.
                # Let's try to parse it as python dict via eval since it's likely JS structure compatible with Python dict syntax (mostly)
                # except true/false which we replaced.
                playlist = eval(playlist_json.replace('true', 'True').replace('false', 'False'))
                sources = playlist.get('sources', [])
                tracks = playlist.get('tracks', [])
            except Exception as e:
                pass
                
        result = {
            "id": video_id,
            "sources": sources,
            "tracks": tracks,
            "cookies": cookie_string,
            "html": page_content
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Print error as JSON so Node can parse it
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No ID provided"}))
    else:
        # id could be passed as argument
        get_video_info(sys.argv[1])
