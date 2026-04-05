import Foundation

struct UserExpertise: Codable, Identifiable {
    var id: String { categoryName }
    let categoryName: String
    let level: Int
    let topicsCovered: Int
    let cardsReviewed: Int

    enum CodingKeys: String, CodingKey {
        case categoryName = "category_name"
        case level
        case topicsCovered = "topics_covered"
        case cardsReviewed = "cards_reviewed"
    }

    var levelLabel: String {
        switch level {
        case 1: return "Beginner"
        case 2: return "Familiar"
        case 3: return "Intermediate"
        case 4: return "Advanced"
        case 5: return "Expert"
        default: return "Beginner"
        }
    }
}

struct RecentTopic: Codable, Identifiable {
    var id: String { topic + categoryName }
    let topic: String
    let categoryName: String
    let timesSeen: Int
    let lastSeenAt: String

    enum CodingKeys: String, CodingKey {
        case topic
        case categoryName = "category_name"
        case timesSeen = "times_seen"
        case lastSeenAt = "last_seen_at"
    }
}

struct KnowledgeResponse: Codable {
    let expertise: [UserExpertise]
    let recentTopics: [RecentTopic]
    let totalTopics: Int
    let totalCardsReviewed: Int

    enum CodingKeys: String, CodingKey {
        case expertise
        case recentTopics = "recent_topics"
        case totalTopics = "total_topics"
        case totalCardsReviewed = "total_cards_reviewed"
    }
}
