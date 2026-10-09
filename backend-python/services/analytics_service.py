"""Rating and sentiment analysis for lecturer reviews.

Dependency-free so the service can run anywhere Python runs. Sentiment uses a
small lexicon with naive negation handling, which is plenty for short feedback
comments in this portal.
"""
import re
from collections import Counter

POSITIVE_WORDS = {
    "good", "great", "excellent", "amazing", "awesome", "fantastic", "helpful",
    "clear", "engaging", "knowledgeable", "passionate", "inspiring", "patient",
    "friendly", "organized", "effective", "best", "wonderful", "brilliant",
    "approachable", "supportive", "insightful", "enjoy", "enjoyed", "like",
    "loved", "love", "recommend", "understanding", "respectful", "motivating",
}

NEGATIVE_WORDS = {
    "bad", "poor", "terrible", "awful", "boring", "confusing", "unclear",
    "rude", "harsh", "disorganized", "late", "unprepared", "inconsistent",
    "difficult", "unhelpful", "disrespectful", "monotone", "slow", "worst",
    "hate", "hated", "dislike", "unfair", "unapproachable", "dismissive",
}

NEGATIONS = {"not", "no", "never", "cannot", "can't", "dont", "don't", "doesnt",
             "doesn't", "isnt", "isn't", "wasnt", "wasn't", "wont", "won't"}

_TOKEN_RE = re.compile(r"[a-z']+")


def analyze_sentiment(text: str) -> str:
    """Return ``positive``, ``negative`` or ``neutral`` for a comment."""
    if not text or not text.strip():
        return "neutral"

    tokens = _TOKEN_RE.findall(text.lower())
    positive = negative = 0

    for index, token in enumerate(tokens):
        negated = index > 0 and tokens[index - 1] in NEGATIONS
        if token in POSITIVE_WORDS:
            if negated:
                negative += 1
            else:
                positive += 1
        elif token in NEGATIVE_WORDS:
            if negated:
                positive += 1
            else:
                negative += 1

    if positive > negative:
        return "positive"
    if negative > positive:
        return "negative"
    return "neutral"


def summarize_reviews(reviews) -> dict:
    """Compute aggregate statistics for a collection of ``Review`` objects."""
    total = len(reviews)
    if total == 0:
        return {
            "average_rating": 0.0,
            "review_count": 0,
            "distribution": {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0},
            "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
        }

    scores = [review.score for review in reviews]
    distribution = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for score in scores:
        if score <= 20:
            distribution["0-20"] += 1
        elif score <= 40:
            distribution["21-40"] += 1
        elif score <= 60:
            distribution["41-60"] += 1
        elif score <= 80:
            distribution["61-80"] += 1
        else:
            distribution["81-100"] += 1

    sentiment_counts = Counter(review.sentiment or "neutral" for review in reviews)
    sentiment = {
        "positive": sentiment_counts.get("positive", 0),
        "neutral": sentiment_counts.get("neutral", 0),
        "negative": sentiment_counts.get("negative", 0),
    }

    return {
        "average_rating": round(sum(scores) / total, 2),
        "review_count": total,
        "highest": max(scores),
        "lowest": min(scores),
        "distribution": distribution,
        "sentiment": sentiment,
    }


def lecturer_summary(lecturer) -> dict:
    """Full profile payload for a single lecturer, including review stats."""
    payload = lecturer.to_dict()
    payload.update(summarize_reviews(lecturer.reviews))
    return payload


def overview(lecturers, reviews) -> dict:
    """Portal-wide analytics across every lecturer and review."""
    stats = summarize_reviews(reviews)
    ranked = sorted(
        (
            {
                "id": lecturer.id,
                "name": lecturer.name,
                "department": lecturer.department,
                "average_rating": round(
                    sum(r.score for r in lecturer.reviews) / len(lecturer.reviews), 2
                )
                if lecturer.reviews
                else 0.0,
                "review_count": len(lecturer.reviews),
            }
            for lecturer in lecturers
        ),
        key=lambda item: (item["average_rating"], item["review_count"]),
        reverse=True,
    )

    return {
        "lecturer_count": len(lecturers),
        **stats,
        "top_lecturers": ranked[:5],
        "bottom_lecturers": [item for item in reversed(ranked[-5:]) if item["review_count"]],
    }
