import Foundation

enum APIError: LocalizedError {
    case unauthorized
    case serverError(String)
    case networkError(Error)
    case decodingError(Error)

    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "Please sign in again"
        case .serverError(let msg):
            return msg
        case .networkError(let err):
            return err.localizedDescription
        case .decodingError(let err):
            return "Data error: \(err.localizedDescription)"
        }
    }
}

@MainActor
class APIClient: ObservableObject {
    static let shared = APIClient()

    var baseURL: String {
        ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000"
    }

    private var authToken: String? {
        AuthService.shared.accessToken
    }

    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 30
        return URLSession(configuration: config)
    }()

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        return d
    }()

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        return e
    }()

    func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: [String: Any]? = nil,
        queryParams: [String: String]? = nil
    ) async throws -> T {
        var urlString = "\(baseURL)\(path)"
        if let params = queryParams, !params.isEmpty {
            let query = params.map { key, value in
                let escapedKey = key.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? key
                let escapedValue = value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
                return "\(escapedKey)=\(escapedValue)"
            }.joined(separator: "&")
            urlString += "?\(query)"
        }

        guard let url = URL(string: urlString) else {
            throw APIError.serverError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError("Invalid response")
        }

        if httpResponse.statusCode == 401 {
            // Try to refresh the token before signing out
            do {
                try await AuthService.shared.refreshSession()
                // Retry with the new token
                if let newToken = AuthService.shared.accessToken {
                    var retryRequest = request
                    retryRequest.setValue("Bearer \(newToken)", forHTTPHeaderField: "Authorization")
                    let (retryData, retryResponse) = try await session.data(for: retryRequest)
                    guard let retryHttp = retryResponse as? HTTPURLResponse else {
                        throw APIError.serverError("Invalid response")
                    }
                    if retryHttp.statusCode == 401 {
                        AuthService.shared.signOut()
                        throw APIError.unauthorized
                    }
                    if retryHttp.statusCode >= 400 {
                        if let errorBody = try? JSONSerialization.jsonObject(with: retryData) as? [String: Any],
                           let errorMsg = errorBody["error"] as? String {
                            throw APIError.serverError(errorMsg)
                        }
                        throw APIError.serverError("HTTP \(retryHttp.statusCode)")
                    }
                    return try decoder.decode(T.self, from: retryData)
                }
            } catch let apiError as APIError {
                // Propagate specific API errors (e.g. serverError from retry)
                // but sign out only on unauthorized
                if case .unauthorized = apiError {
                    AuthService.shared.signOut()
                }
                throw apiError
            } catch {
                AuthService.shared.signOut()
                throw APIError.unauthorized
            }
            // If refresh succeeded but no token was available, sign out
            AuthService.shared.signOut()
            throw APIError.unauthorized
        }

        if httpResponse.statusCode >= 400 {
            if let errorBody = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let errorMsg = errorBody["error"] as? String {
                throw APIError.serverError(errorMsg)
            }
            throw APIError.serverError("HTTP \(httpResponse.statusCode)")
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    // Helper for requests that return no meaningful body
    private func requestVoid(
        path: String,
        method: String = "GET",
        body: [String: Any]? = nil,
        queryParams: [String: String]? = nil
    ) async throws {
        var urlString = "\(baseURL)\(path)"
        if let params = queryParams, !params.isEmpty {
            let query = params.map { key, value in
                let escapedKey = key.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? key
                let escapedValue = value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
                return "\(escapedKey)=\(escapedValue)"
            }.joined(separator: "&")
            urlString += "?\(query)"
        }

        guard let url = URL(string: urlString) else {
            throw APIError.serverError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError("Invalid response")
        }

        if httpResponse.statusCode == 401 {
            // Try to refresh the token before signing out
            do {
                try await AuthService.shared.refreshSession()
                // Retry with the new token
                if let newToken = AuthService.shared.accessToken {
                    var retryRequest = request
                    retryRequest.setValue("Bearer \(newToken)", forHTTPHeaderField: "Authorization")
                    let (retryData, retryResponse) = try await session.data(for: retryRequest)
                    guard let retryHttp = retryResponse as? HTTPURLResponse else {
                        throw APIError.serverError("Invalid response")
                    }
                    if retryHttp.statusCode == 401 {
                        AuthService.shared.signOut()
                        throw APIError.unauthorized
                    }
                    if retryHttp.statusCode >= 400 {
                        if let errorBody = try? JSONSerialization.jsonObject(with: retryData) as? [String: Any],
                           let errorMsg = errorBody["error"] as? String {
                            throw APIError.serverError(errorMsg)
                        }
                        throw APIError.serverError("HTTP \(retryHttp.statusCode)")
                    }
                    return
                }
            } catch is APIError {
                throw APIError.unauthorized
            } catch {
                AuthService.shared.signOut()
                throw APIError.unauthorized
            }
        }

        if httpResponse.statusCode >= 400 {
            if let errorBody = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let errorMsg = errorBody["error"] as? String {
                throw APIError.serverError(errorMsg)
            }
            throw APIError.serverError("HTTP \(httpResponse.statusCode)")
        }
    }

    // MARK: - Briefings

    func getTodayBriefing() async throws -> BriefingWrapper {
        try await request(path: "/api/briefings/today")
    }

    func generateBriefing() async throws -> GenerateWrapper {
        try await request(path: "/api/briefings/generate", method: "POST")
    }

    // MARK: - Feedback

    func sendFeedback(cardId: String, action: String) async throws {
        try await requestVoid(
            path: "/api/feedback",
            method: "POST",
            body: ["card_id": cardId, "action": action]
        )
    }

    // MARK: - Categories

    func getCategories() async throws -> CategoriesResponse {
        try await request(path: "/api/categories")
    }

    func addCategory(name: String, sourceType: String = "news") async throws -> CategoryResponse {
        try await request(
            path: "/api/categories",
            method: "POST",
            body: ["name": name, "source_type": sourceType]
        )
    }

    func updateCategory(id: String, updates: [String: Any]) async throws -> CategoryResponse {
        try await request(
            path: "/api/categories/\(id)",
            method: "PATCH",
            body: updates
        )
    }

    func deleteCategory(id: String) async throws {
        try await requestVoid(
            path: "/api/categories/\(id)",
            method: "DELETE"
        )
    }

    // MARK: - Stats

    func getStats() async throws -> StatsResponse {
        try await request(path: "/api/stats")
    }

    // MARK: - Feed

    func getFeed(cursor: String? = nil, filter: String? = nil, limit: Int = 20) async throws -> FeedResponse {
        var params: [String: String] = ["limit": String(limit)]
        if let cursor = cursor {
            params["cursor"] = cursor
        }
        if let filter = filter {
            params["filter"] = filter
        }
        return try await request(path: "/api/feed", queryParams: params)
    }

    // MARK: - Reading List

    func getReadingList(readFilter: Bool? = nil) async throws -> ReadingListResponse {
        var params: [String: String] = [:]
        if let readFilter = readFilter {
            params["is_read"] = readFilter ? "true" : "false"
        }
        return try await request(
            path: "/api/reading-list",
            queryParams: params.isEmpty ? nil : params
        )
    }

    func saveToReadingList(data: [String: Any]) async throws {
        try await requestVoid(
            path: "/api/reading-list",
            method: "POST",
            body: data
        )
    }

    func updateReadingListItem(id: String, updates: [String: Any]) async throws {
        try await requestVoid(
            path: "/api/reading-list/\(id)",
            method: "PATCH",
            body: updates
        )
    }

    func removeFromReadingList(id: String) async throws {
        try await requestVoid(
            path: "/api/reading-list/\(id)",
            method: "DELETE"
        )
    }

    // MARK: - Knowledge

    func getKnowledge() async throws -> KnowledgeResponse {
        try await request(path: "/api/knowledge")
    }

    // MARK: - Settings

    func getSettings() async throws -> UserProfileResponse {
        try await request(path: "/api/settings")
    }

    func updateSettings(updates: [String: Any]) async throws -> UserProfileResponse {
        try await request(
            path: "/api/settings",
            method: "PATCH",
            body: updates
        )
    }
}
