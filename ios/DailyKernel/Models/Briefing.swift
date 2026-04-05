import Foundation

struct BriefingResponse: Codable {
    let id: String?
    let date: String?
    let cards: [Card]?
    let generatedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, date, cards
        case generatedAt = "generated_at"
    }
}

struct BriefingWrapper: Codable {
    let briefing: BriefingResponse?
}

struct GenerateWrapper: Codable {
    let briefing: BriefingResponse
}
