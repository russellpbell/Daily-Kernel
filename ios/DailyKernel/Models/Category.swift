import Foundation

struct Category: Codable, Identifiable {
    let id: String
    var name: String
    var weight: Double
    var isActive: Bool
    var sourceType: String

    enum CodingKeys: String, CodingKey {
        case id, name, weight
        case isActive = "is_active"
        case sourceType = "source_type"
    }
}

struct CategoriesResponse: Codable {
    let categories: [Category]
}

struct CategoryResponse: Codable {
    let category: Category
}
