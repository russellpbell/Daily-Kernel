import Foundation

struct Card: Codable, Identifiable {
    let id: String
    let categoryName: String
    let title: String
    let summary: String
    let sourceUrl: String?
    let sourceName: String?
    let position: Int
    var feedback: String?  // "thumbs_up", "thumbs_down", "skip", or nil
    var isReview: Bool?
    var reviewId: String?

    enum CodingKeys: String, CodingKey {
        case id
        case categoryName = "category_name"
        case title, summary
        case sourceUrl = "source_url"
        case sourceName = "source_name"
        case position, feedback
        case isReview = "is_review"
        case reviewId = "review_id"
    }
}
