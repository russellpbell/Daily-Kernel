import Foundation

struct UserProfile: Codable {
    let id: String
    let name: String
    let email: String
    let cardsPerBriefing: Int

    enum CodingKeys: String, CodingKey {
        case id, name, email
        case cardsPerBriefing = "cards_per_briefing"
    }
}

struct UserProfileResponse: Codable {
    let user: UserProfile
}
