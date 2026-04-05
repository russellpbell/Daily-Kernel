import Foundation

struct ReadingListItem: Codable, Identifiable {
    let id: String
    let cardId: String?
    let title: String
    let summary: String
    let sourceUrl: String?
    let sourceName: String?
    let categoryName: String
    var notes: String?
    var isRead: Bool
    let savedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case cardId = "card_id"
        case title, summary
        case sourceUrl = "source_url"
        case sourceName = "source_name"
        case categoryName = "category_name"
        case notes
        case isRead = "is_read"
        case savedAt = "saved_at"
    }
}

struct ReadingListResponse: Codable {
    let items: [ReadingListItem]
}
