import json
import re
import time
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://fitcron.com"
LIST_URL = "https://fitcron.com/exercises/"

session = requests.Session()
session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
})


def get_soup(url):
    try:
        r = session.get(url, timeout=30)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except requests.RequestException as e:
        raise RuntimeError(f"Error pidiendo {url}: {e}")


def clean(text):
    return re.sub(r"\s+", " ", text).strip()


def slug(url):
    return urlparse(url).path.strip("/").split("/")[-1]


def get_exercise_links():
    soup = get_soup(LIST_URL)
    links = set()

    for a in soup.select('a[href*="/exercise/"]'):
        href = a.get("href")
        if href:
            full = urljoin(BASE_URL, href)
            if "/exercise/" in full:
                links.add(full)

    return sorted(list(links))


def extract_gif(soup):
    for img in soup.find_all("img"):
        for attr in ("src", "data-src", "data-lazy-src", "srcset"):
            value = img.get(attr)
            if not value:
                continue

            if attr == "srcset":
                for part in value.split(","):
                    url = part.strip().split(" ")[0]
                    if ".gif" in url.lower():
                        return url
            else:
                if ".gif" in value.lower():
                    return value

    html = str(soup)
    m = re.search(r'https?://[^"\']+\.gif', html, re.IGNORECASE)
    if m:
        return m.group(0)

    m = re.search(r'(/wp-content/uploads/[^"\']+\.gif)', html, re.IGNORECASE)
    if m:
        return urljoin(BASE_URL, m.group(1))

    return None


def extract_field(soup, label):
    text = soup.get_text("\n", strip=True)
    m = re.search(rf"{re.escape(label)}\s*(.+)", text)
    if m:
        return clean(m.group(1))
    return None


def split_list(value):
    if not value:
        return []
    return [clean(x) for x in value.split(",") if clean(x)]


def parse_difficulty(value):
    if not value:
        return None
    m = re.search(r"(\d+)", value)
    return int(m.group(1)) if m else None


def parse_exercise(url):
    soup = get_soup(url)

    h1 = soup.find("h1")
    name = clean(h1.get_text()) if h1 else slug(url)

    return {
        "name": name,
        "slug": slug(url),
        "url": url,
        "exerciseType": extract_field(soup, "Tipo de ejercicio:"),
        "muscleGroup": extract_field(soup, "Grupo muscular:"),
        "involvedMuscles": split_list(extract_field(soup, "Músculos involucrados:")),
        "equipment": split_list(extract_field(soup, "Equipamiento / Material:")),
        "difficulty": parse_difficulty(extract_field(soup, "Dificultad:")),
        "gifUrl": extract_gif(soup),
    }


def main():
    links = get_exercise_links()
    print(f"Ejercicios encontrados: {len(links)}")

    exercises = []
    errors = []

    for i, link in enumerate(links, start=1):
        try:
            ex = parse_exercise(link)
            exercises.append(ex)
            print(f"[{i}/{len(links)}] OK - {ex['name']}")
        except Exception as e:
            errors.append({"url": link, "error": str(e)})
            print(f"[{i}/{len(links)}] ERROR - {e}")

        time.sleep(0.5)

    exercises.sort(key=lambda x: (
        x.get("muscleGroup") or "",
        x.get("difficulty") or 0,
        x.get("name") or ""
    ))

    with open("fitcron_exercises.json", "w", encoding="utf-8") as f:
        json.dump(exercises, f, ensure_ascii=False, indent=2)

    with open("fitcron_errors.json", "w", encoding="utf-8") as f:
        json.dump(errors, f, ensure_ascii=False, indent=2)

    print("Generado fitcron_exercises.json")
    print("Generado fitcron_errors.json")


if __name__ == "__main__":
    main()