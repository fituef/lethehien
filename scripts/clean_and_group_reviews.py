import os
import re
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
CLEAN_DIR = DATA_DIR / "clean"
CRAWL_YEAR = 2026

def parse_google_relative_year(time_text, crawl_year=CRAWL_YEAR):
    if not time_text:
        return None
    text = str(time_text).lower()
    text = re.sub(r'^(thời gian chỉnh sửa:\s*|edited\s*)', '', text).strip()
    
    # Giờ, ngày, tuần, tháng trước -> năm cào dữ liệu (2026)
    if any(unit in text for unit in ['giờ', 'ngày', 'tuần', 'tháng', 'hour', 'day', 'week', 'month']):
        return crawl_year
    
    # 1 năm trước
    if 'một năm trước' in text or 'a year ago' in text or '1 year ago' in text:
        return crawl_year - 1
        
    # X năm trước
    m = re.search(r'(\d+)\s*(năm|year)', text)
    if m:
        years_ago = int(m.group(1))
        return crawl_year - years_ago
        
    return None

def parse_tripadvisor_year(date_str):
    if not date_str:
        return None
    date_str = str(date_str).strip()
    m = re.match(r'^(\d{4})', date_str)
    if m:
        return int(m.group(1))
    return None

def clean_google_record(r, brand):
    # Ưu tiên text gốc
    orig_text = (r.get("review_text_original") or "").strip()
    translated_text = (r.get("review_text") or "").strip()
    comment = orig_text if orig_text else translated_text
    comment = comment.strip()
    
    # Tiêu chí: comment > 20 ký tự VÀ tối thiểu 6 từ
    word_count = len(comment.split())
    if len(comment) <= 20 or word_count < 6:
        return None
        
    rating = r.get("rating")
    try:
        rating = int(rating)
    except (ValueError, TypeError):
        rating = None
        
    year = parse_google_relative_year(r.get("review_datetime_text"))
    
    # Ngôn ngữ
    orig_lang = r.get("original_language") or "unknown"
    if orig_lang == "Tiếng Anh":
        lang = "en"
    elif orig_lang in ["Tiếng Việt", "Gốc"]:
        lang = "vi"
    else:
        lang = str(orig_lang).lower()

    return {
        "review_id": str(r.get("review_id")),
        "place_name": brand,
        "platform": "GoogleMap",
        "year": year,
        "rating": rating,
        "comment": comment,
        "language": lang,
        "travel_type": None
    }

def clean_tripadvisor_record(r, brand):
    title = (r.get("review_title") or "").strip()
    text = (r.get("review_text") or "").strip()
    
    if title and text:
        comment = f"{title} - {text}"
    elif text:
        comment = text
    else:
        comment = title
        
    comment = comment.strip()
    # Tiêu chí: comment > 20 ký tự VÀ tối thiểu 6 từ
    word_count = len(comment.split())
    if len(comment) <= 20 or word_count < 6:
        return None
        
    rating = r.get("rating")
    try:
        rating = int(rating)
    except (ValueError, TypeError):
        rating = None
        
    year = parse_tripadvisor_year(r.get("review_date"))
    lang = r.get("review_language") or "en"
    travel_type = r.get("travel_type")
    
    return {
        "review_id": str(r.get("review_id")),
        "place_name": brand,
        "platform": "Tripadvisor",
        "year": year,
        "rating": rating,
        "comment": comment,
        "language": str(lang).lower(),
        "travel_type": travel_type if travel_type else None
    }

def process_cleaning():
    CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Vespa Adventures
    vespa_gm_path = DATA_DIR / "googlemap" / "vespa_adventures_saigon_motorbike_tours_reviews.json"
    vespa_ta_path = DATA_DIR / "tripadvisor" / "VespaTour_Tripadvisor_Clean.json"
    
    vespa_reviews = []
    with open(vespa_gm_path, "r", encoding="utf-8") as f:
        for r in json.load(f):
            cleaned = clean_google_record(r, "Vespa Adventures")
            if cleaned:
                vespa_reviews.append(cleaned)
                
    with open(vespa_ta_path, "r", encoding="utf-8") as f:
        for r in json.load(f):
            cleaned = clean_tripadvisor_record(r, "Vespa Adventures")
            if cleaned:
                vespa_reviews.append(cleaned)
                
    # 2. XO Tours
    xo_gm_path = DATA_DIR / "googlemap" / "xo_tours_saigon_food_tours_and_city_tours_led_by_women_reviews.json"
    xo_ta_path = DATA_DIR / "tripadvisor" / "EXOTour_Tripadvisor_Clean.json"
    
    xo_reviews = []
    with open(xo_gm_path, "r", encoding="utf-8") as f:
        for r in json.load(f):
            cleaned = clean_google_record(r, "XO Tours")
            if cleaned:
                xo_reviews.append(cleaned)
                
    with open(xo_ta_path, "r", encoding="utf-8") as f:
        for r in json.load(f):
            cleaned = clean_tripadvisor_record(r, "XO Tours")
            if cleaned:
                xo_reviews.append(cleaned)
                
    # Lưu file JSON
    vespa_out = CLEAN_DIR / "vespa_adventures_clean.json"
    xo_out = CLEAN_DIR / "xo_tours_clean.json"
    combined_out = CLEAN_DIR / "all_tours_combined_clean.json"
    
    with open(vespa_out, "w", encoding="utf-8") as f:
        json.dump(vespa_reviews, f, ensure_ascii=False, indent=2)
        
    with open(xo_out, "w", encoding="utf-8") as f:
        json.dump(xo_reviews, f, ensure_ascii=False, indent=2)
        
    combined_reviews = vespa_reviews + xo_reviews
    with open(combined_out, "w", encoding="utf-8") as f:
        json.dump(combined_reviews, f, ensure_ascii=False, indent=2)

    # Lưu thêm file XLSX (Excel)
    try:
        import pandas as pd
        pd.DataFrame(vespa_reviews).to_excel(CLEAN_DIR / "vespa_adventures_clean.xlsx", index=False)
        pd.DataFrame(xo_reviews).to_excel(CLEAN_DIR / "xo_tours_clean.xlsx", index=False)
        pd.DataFrame(combined_reviews).to_excel(CLEAN_DIR / "all_tours_combined_clean.xlsx", index=False)
        print("Đã xuất song song định dạng Excel (.xlsx).")
    except Exception as e:
        print(f"Lỗi khi xuất xlsx: {e}")
        
    print(f"=== KẾT QUẢ LÀM SẠCH VÀ GOM NHÓM ===")
    print(f"1. Vespa Adventures: {len(vespa_reviews)} records -> {vespa_out} & .xlsx")
    print(f"2. XO Tours:         {len(xo_reviews)} records -> {xo_out} & .xlsx")
    print(f"3. Tổng hợp chung:   {len(combined_reviews)} records -> {combined_out} & .xlsx")

if __name__ == "__main__":
    process_cleaning()
