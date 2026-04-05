import Foundation

struct Streak: Codable {
    let currentStreak: Int
    let longestStreak: Int
    let lastReviewDate: String?

    enum CodingKeys: String, CodingKey {
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case lastReviewDate = "last_review_date"
    }
}

struct DailyCompletion: Codable, Identifiable {
    var id: String { date }
    let date: String
    let cardsReviewed: Int
    let cardsTotal: Int

    enum CodingKeys: String, CodingKey {
        case date
        case cardsReviewed = "cards_reviewed"
        case cardsTotal = "cards_total"
    }
}

struct StatsResponse: Codable {
    let streak: Streak
    let completions: [DailyCompletion]
}
