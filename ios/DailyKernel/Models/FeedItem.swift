import Foundation

struct FeedItem: Codable, Identifiable {
    let id: String
    let title: String
    let summary: String
    let sourceUrl: String?
    let sourceName: String?
    let categoryName: String
    let timestamp: String
    let source: String  // "liked", "saved", "both"
    var isRead: Bool?

    enum CodingKeys: String, CodingKey {
        case id, title, summary
        case sourceUrl = "source_url"
        case sourceName = "source_name"
        case categoryName = "category_name"
        case timestamp, source
        case isRead = "is_read"
    }
}

struct FeedResponse: Codable {
    let items: [FeedItem]
    let hasMore: Bool

    enum CodingKeys: String, CodingKey {
        case items
        case hasMore = "has_more"
    }
}
