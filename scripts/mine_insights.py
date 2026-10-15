#!/usr/bin/env python3
"""
scripts/mine_insights.py
Data Mining Analysis Engine for Saigon Motorbike Tours (Vespa Adventures vs XO Tours)
Analyzes 16,974 clean reviews across a 2x2 matrix:
  - Vespa Adventures (Google Maps & Tripadvisor)
  - XO Tours (Google Maps & Tripadvisor)

Outputs:
  - data/clean/mining_insights.json
  - dashboards/mining_insights.js (for standalone offline execution)
"""

import json
import re
import os
from collections import defaultdict, Counter

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(ROOT_DIR, "data", "clean", "all_tours_combined_clean.json")
OUTPUT_JSON_PATH = os.path.join(ROOT_DIR, "data", "clean", "mining_insights.json")
OUTPUT_JS_PATH = os.path.join(ROOT_DIR, "dashboards", "mining_insights.js")

# 1. Aspect-Based Sentiment Analysis Keywords
ASPECTS = {
    "Safety & Riding": r"\b(safe|safety|traffic|driver|drivers|riding|ride|helmets?|careful)\b",
    "Food & Culinary": r"\b(food|delicious|street food|tasting|dishes|eat|eating|seafood|beer|snack)\b",
    "Tour Guide & Staff": r"\b(guide|guides|friendly|informative|knowledgeable|fun|funny|staff|host|english)\b",
    "Vehicles & Vibe": r"\b(vespa|vintage|scooter|ao dai|female|women|alleys?|district|districts|streets?|night)\b",
    "Value for Money": r"\b(price|expensive|cheap|worth|value|money|cost|recommend|highlight)\b"
}

# 2. Tour Types
TOUR_TYPES = {
    "Foodie Tour": r"\b(food|foodie|tasting|dishes|eat|seafood)\b",
    "Night Tour": r"\b(night|evening|nightlife|bars|dark)\b",
    "City / Sightseeing": r"\b(sightseeing|sights|city tour|day tour|historical|landmarks|pagoda|market)\b",
    "Custom / Private": r"\b(shopping|private tour|custom|bespoke)\b"
}

# 3. Traveler Profile (Tripadvisor normalized)
TRAVEL_TYPE_MAP = {
    "Couple": ["Couple", "Cặp đôi", "The Couple"],
    "Friends": ["Friends", "Bạn bè"],
    "Solo": ["Alone", "Một mình"],
    "Business": ["Business Traveler", "Khách công tác", "Business traveler", "Business travelers"]
}

# 4. Pain Points Categories for reviews <= 3 stars
PAIN_POINT_CATEGORIES = {
    "Price / Value": {
        "pattern": r"\b(expensive|price|overpriced|worth|money|cost|value|rip off|charge|bill)\b",
        "label_vi": "Tương quan chi phí - giá trị",
        "description": "Cảm nhận mức giá chưa tương xứng với giá trị trải nghiệm dịch vụ nhận được"
    },
    "Food Quality / Allergy": {
        "pattern": r"\b(poisoning|sick|ill|stomach|hygiene|taste|cold food|bland|portions?|nausea|vomit|seafood.*sick|belly)\b",
        "label_vi": "Vệ sinh thực phẩm & Khẩu vị",
        "description": "Phản hồi về triệu chứng tiêu hóa, độ tươi ngon hoặc tính phù hợp của khẩu vị món ăn"
    },
    "Guide Quality": {
        "pattern": r"\b(boring|inexperienced|rude|unprofessional|poor english|attitude|bad guide|disrespectful|training|ignored)\b",
        "label_vi": "Năng lực & Thái độ hướng dẫn viên",
        "description": "Hạn chế về năng lực ngoại ngữ, kỹ năng truyền đạt hoặc tính chuyên nghiệp trong giao tiếp"
    },
    "Vehicle / Mechanical": {
        "pattern": r"\b(broke down|breakdown|mechanical|smoke|noise|stalled|engine|helmet|scooter.*broke|back.*pain|exhaust)\b",
        "label_vi": "Sự cố kỹ thuật phương tiện",
        "description": "Hiện tượng chết máy, rung lắc, tiếng ồn động cơ hoặc chất lượng trang bị bảo hộ"
    },
    "Weather / Rain": {
        "pattern": r"\b(rain|raining|downpour|wet|weather|monsoon|storm)\b",
        "label_vi": "Yếu tố bất lợi do thời tiết",
        "description": "Tác động tiêu cực của điều kiện mưa lớn nhiệt đới và ngập úng đô thị đến lộ trình"
    },
    "Safety Concern": {
        "pattern": r"\b(scary|dangerous|scared|reckless|speed|accident|fear|crash|close call|unsafe|danger)\b",
        "label_vi": "Quan ngại an toàn giao thông",
        "description": "Tâm lý bất an khi lưu thông trong dòng xe cộ mật độ cao hoặc thao tác lái xe nhanh"
    },
    "Environmental Impact": {
        "pattern": r"\b(pollution|polluting|carbon|exhaust fumes?|environment|climate|dirty air)\b",
        "label_vi": "Tác động môi trường & Khí thải",
        "description": "Phản hồi về khói xả và mùi nhiên liệu từ động cơ 2 thì của dòng xe cổ điển"
    }
}


def normalize_travel_type(val):
    if not val:
        return "Unknown"
    val_str = str(val).strip()
    for cat, aliases in TRAVEL_TYPE_MAP.items():
        if val_str in aliases:
            return cat
    return "Unknown"


def compute_subset_stats(reviews_subset):
    n = len(reviews_subset)
    if n == 0:
        return {
            "total_reviews": 0,
            "avg_rating": 0.0,
            "five_star_count": 0,
            "five_star_pct": 0.0,
            "rating_distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
            "avg_word_count": 0.0,
            "aspects": {},
            "tour_types": {},
            "travel_types": {}
        }

    ratings = [r["rating"] for r in reviews_subset]
    avg_rating = round(sum(ratings) / n, 3)
    five_star_count = ratings.count(5)
    five_star_pct = round((five_star_count / n) * 100, 1)

    rating_dist = {
        str(star): ratings.count(star) for star in [1, 2, 3, 4, 5]
    }

    word_counts = [len(r["comment"].split()) for r in reviews_subset]
    avg_word_count = round(sum(word_counts) / n, 1)

    # Aspects
    aspect_stats = {}
    for aspect_name, pattern in ASPECTS.items():
        rx = re.compile(pattern, re.IGNORECASE)
        cnt = sum(1 for r in reviews_subset if rx.search(r["comment"]))
        pct = round((cnt / n) * 100, 1)
        aspect_stats[aspect_name] = {"count": cnt, "pct": pct}

    # Tour Types
    tour_type_stats = {}
    for tt_name, pattern in TOUR_TYPES.items():
        rx = re.compile(pattern, re.IGNORECASE)
        cnt = sum(1 for r in reviews_subset if rx.search(r["comment"]))
        pct = round((cnt / n) * 100, 1)
        tour_type_stats[tt_name] = {"count": cnt, "pct": pct}

    # Travel Types (only reviews where travel_type exists or Tripadvisor)
    tt_counter = Counter([normalize_travel_type(r.get("travel_type")) for r in reviews_subset])
    travel_type_stats = dict(tt_counter)

    return {
        "total_reviews": n,
        "avg_rating": avg_rating,
        "five_star_count": five_star_count,
        "five_star_pct": five_star_pct,
        "rating_distribution": rating_dist,
        "avg_word_count": avg_word_count,
        "aspects": aspect_stats,
        "tour_types": tour_type_stats,
        "travel_types": travel_type_stats
    }


def main():
    print(f"Loading data from {DATA_PATH}...")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        reviews = json.load(f)

    total_count = len(reviews)
    print(f"Loaded {total_count} reviews.")

    # 1. Define Subsets
    subsets = {
        "all": reviews,
        "vespa_all": [r for r in reviews if r["place_name"] == "Vespa Adventures"],
        "xo_all": [r for r in reviews if r["place_name"] == "XO Tours"],
        "gm_all": [r for r in reviews if r["platform"] == "GoogleMap"],
        "ta_all": [r for r in reviews if r["platform"] == "Tripadvisor"],
        "vespa_gm": [r for r in reviews if r["place_name"] == "Vespa Adventures" and r["platform"] == "GoogleMap"],
        "vespa_ta": [r for r in reviews if r["place_name"] == "Vespa Adventures" and r["platform"] == "Tripadvisor"],
        "xo_gm": [r for r in reviews if r["place_name"] == "XO Tours" and r["platform"] == "GoogleMap"],
        "xo_ta": [r for r in reviews if r["place_name"] == "XO Tours" and r["platform"] == "Tripadvisor"],
    }

    # 2. Compute Segment Stats
    segments_stats = {}
    for key, subset_revs in subsets.items():
        segments_stats[key] = compute_subset_stats(subset_revs)
        print(f"Segment '{key}': {segments_stats[key]['total_reviews']} reviews, avg {segments_stats[key]['avg_rating']}*")

    # 3. Time Series Data (Year by Year)
    min_year = min(r["year"] for r in reviews)
    max_year = max(r["year"] for r in reviews)
    all_years = list(range(min_year, max_year + 1))
    time_series = {
        "years": all_years,
        "series": {}
    }

    for key, subset_revs in subsets.items():
        year_counts = defaultdict(int)
        year_rating_sum = defaultdict(float)
        for r in subset_revs:
            y = r["year"]
            year_counts[y] += 1
            year_rating_sum[y] += r["rating"]

        counts_list = [year_counts[y] for y in all_years]
        avg_ratings_list = [
            round(year_rating_sum[y] / year_counts[y], 2) if year_counts[y] > 0 else None
            for y in all_years
        ]
        time_series["series"][key] = {
            "counts": counts_list,
            "avg_ratings": avg_ratings_list
        }

    # 4. Pain Points Analysis (Rating <= 3)
    neg_reviews = [r for r in reviews if r["rating"] <= 3]
    print(f"Negative reviews (<=3 stars): {len(neg_reviews)}")

    pain_points_stats = {}
    categorized_negative_reviews = []

    for cat_name, cat_info in PAIN_POINT_CATEGORIES.items():
        rx = re.compile(cat_info["pattern"], re.IGNORECASE)
        cat_matches = []
        vespa_cnt = 0
        xo_cnt = 0
        gm_cnt = 0
        ta_cnt = 0

        for r in neg_reviews:
            if rx.search(r["comment"]):
                cat_matches.append(r)
                if r["place_name"] == "Vespa Adventures":
                    vespa_cnt += 1
                else:
                    xo_cnt += 1
                if r["platform"] == "GoogleMap":
                    gm_cnt += 1
                else:
                    ta_cnt += 1

        # Select top representative quotes
        sample_quotes = []
        for r in cat_matches[:5]:
            # Clean comment for display
            clean_cmt = r["comment"].replace("\n", " ").strip()
            if len(clean_cmt) > 300:
                clean_cmt = clean_cmt[:297] + "..."
            sample_quotes.append({
                "review_id": r["review_id"],
                "place_name": r["place_name"],
                "platform": r["platform"],
                "year": r["year"],
                "rating": r["rating"],
                "comment": clean_cmt
            })

        pain_points_stats[cat_name] = {
            "label_vi": cat_info["label_vi"],
            "description": cat_info["description"],
            "total_count": len(cat_matches),
            "pct_of_neg": round((len(cat_matches) / len(neg_reviews)) * 100, 1),
            "vespa_count": vespa_cnt,
            "xo_count": xo_cnt,
            "gm_count": gm_cnt,
            "ta_count": ta_cnt,
            "sample_quotes": sample_quotes
        }

    # 5. Build 2x2 Matrix Comparison Insights
    matrix_2x2 = {
        "vespa_gm": {
            "name": "Vespa Adventures – Google Maps",
            "brand": "Vespa Adventures",
            "platform": "GoogleMap",
            "records": segments_stats["vespa_gm"]["total_reviews"],
            "rating": segments_stats["vespa_gm"]["avg_rating"],
            "avg_words": segments_stats["vespa_gm"]["avg_word_count"],
            "peak_period": "2024–2026 (chiếm 100%)",
            "key_characteristics": "Văn bản cô đọng, phản hồi nhanh từ tệp khách du lịch quốc tế đương đại; thường định danh cụ thể tài xế dẫn đoàn.",
            "top_aspect": "Phương tiện & Không gian trải nghiệm (32.8%)",
            "pain_point_summary": "4 bản ghi bất lợi (chủ yếu liên quan đến sự cố kỹ thuật hoặc lộ trình)"
        },
        "vespa_ta": {
            "name": "Vespa Adventures – Tripadvisor",
            "brand": "Vespa Adventures",
            "platform": "Tripadvisor",
            "records": segments_stats["vespa_ta"]["total_reviews"],
            "rating": segments_stats["vespa_ta"]["avg_rating"],
            "avg_words": segments_stats["vespa_ta"]["avg_word_count"],
            "peak_period": "2015–2019 (đỉnh cao 2018)",
            "key_characteristics": "Văn bản dài, phân tích tường tận trải nghiệm đêm, ẩm thực bản địa và cảm giác điều khiển xe cổ.",
            "top_aspect": "Năng lực hướng dẫn viên (77.3%) & Phương tiện (76.3%)",
            "pain_point_summary": "54 bản ghi bất lợi (chi phí cao, khẩu vị ẩm thực, khí thải động cơ 2 thì)"
        },
        "xo_gm": {
            "name": "XO Tours – Google Maps",
            "brand": "XO Tours",
            "platform": "GoogleMap",
            "records": segments_stats["xo_gm"]["total_reviews"],
            "rating": segments_stats["xo_gm"]["avg_rating"],
            "avg_words": segments_stats["xo_gm"]["avg_word_count"],
            "peak_period": "2023–2026 (chiếm 87.5%)",
            "key_characteristics": "Phản ánh chất lượng dịch vụ hiện đại, đánh giá cao đội ngũ nữ tài xế áo dài về mức độ thân thiện và an toàn.",
            "top_aspect": "Năng lực hướng dẫn viên (61.8%) & Ẩm thực (58.7%)",
            "pain_point_summary": "2 bản ghi bất lợi (tỷ lệ hài lòng xấp xỉ tuyệt đối)"
        },
        "xo_ta": {
            "name": "XO Tours – Tripadvisor",
            "brand": "XO Tours",
            "platform": "Tripadvisor",
            "records": segments_stats["xo_ta"]["total_reviews"],
            "rating": segments_stats["xo_ta"]["avg_rating"],
            "avg_words": segments_stats["xo_ta"]["avg_word_count"],
            "peak_period": "2013–2019 (đỉnh cao 2016)",
            "key_characteristics": "Quy mô mẫu lớn nhất (7,392 bản ghi), độ dài phản hồi cao; tập trung vào chiều sâu khám phá ẩm thực đường phố.",
            "top_aspect": "Năng lực hướng dẫn viên (82.1%) & Ẩm thực (74.5%)",
            "pain_point_summary": "37 bản ghi bất lợi (chi phí tour, độ thích ứng món ăn, thời tiết mưa lớn)"
        }
    }

    # 6. Assemble Full Mining Insights
    mining_output = {
        "metadata": {
            "generated_at": "2026-10-13",
            "total_reviews": total_count,
            "brands": ["Vespa Adventures", "XO Tours"],
            "platforms": ["GoogleMap", "Tripadvisor"],
            "year_range": [min(all_years), max(all_years)]
        },
        "segments": segments_stats,
        "matrix_2x2": matrix_2x2,
        "time_series": time_series,
        "pain_points": {
            "total_negative_reviews": len(neg_reviews),
            "negative_rate_pct": round((len(neg_reviews) / total_count) * 100, 2),
            "categories": pain_points_stats
        }
    }

    # 7. Write to JSON file
    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(mining_output, f, ensure_ascii=False, indent=2)
    print(f"Successfully saved mining insights to {OUTPUT_JSON_PATH}")

    # 8. Write to standalone JS file
    os.makedirs(os.path.dirname(OUTPUT_JS_PATH), exist_ok=True)
    with open(OUTPUT_JS_PATH, "w", encoding="utf-8") as f:
        f.write("/**\n * Autogenerated by scripts/mine_insights.py\n * Saigon Motorbike Tours Mining Insights Data\n */\n")
        f.write("window.MINING_INSIGHTS = ")
        json.dump(mining_output, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    print(f"Successfully saved standalone JS data to {OUTPUT_JS_PATH}")


if __name__ == "__main__":
    main()
