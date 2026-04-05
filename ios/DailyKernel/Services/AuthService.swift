import Foundation
import Combine

@MainActor
class AuthService: ObservableObject {
    static let shared = AuthService()

    @Published var isAuthenticated = false
    @Published var accessToken: String?
    @Published var userEmail: String?

    private let supabaseURL: String
    private let supabaseAnonKey: String

    private init() {
        supabaseURL = ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? "https://your-project.supabase.co"
        supabaseAnonKey = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] ?? ""

        // Restore session from UserDefaults
        if let token = UserDefaults.standard.string(forKey: "access_token"),
           let email = UserDefaults.standard.string(forKey: "user_email") {
            self.accessToken = token
            self.userEmail = email
            self.isAuthenticated = true

            // Validate session in the background
            Task { [weak self] in
                await self?.validateSession()
            }
        }
    }

    func validateSession() async {
        guard isAuthenticated else { return }

        // If we have a refresh token, proactively refresh to ensure a valid session
        guard UserDefaults.standard.string(forKey: "refresh_token") != nil else {
            // No refresh token stored - can't validate, leave state as-is
            return
        }

        do {
            try await refreshSession()
        } catch {
            // refreshSession() already calls signOut() on failure,
            // but if it's a network error we don't want to sign out -
            // the user may just be offline.
            // refreshSession signs out on auth failures; network errors
            // propagate as-is, so we leave the session intact for offline use.
        }
    }

    func signInWithOTP(email: String) async throws {
        let url = URL(string: "\(supabaseURL)/auth/v1/otp")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "email": email,
            "create_user": true
        ])

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode < 400 else {
            throw APIError.serverError("Failed to send verification code")
        }
    }

    func verifyOTP(email: String, code: String) async throws {
        let url = URL(string: "\(supabaseURL)/auth/v1/verify")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "email": email,
            "token": code,
            "type": "email"
        ])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode < 400 else {
            throw APIError.serverError("Invalid verification code")
        }

        // Parse the session response
        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
           let token = json["access_token"] as? String {
            self.accessToken = token
            self.userEmail = email
            self.isAuthenticated = true

            // Persist
            UserDefaults.standard.set(token, forKey: "access_token")
            UserDefaults.standard.set(email, forKey: "user_email")

            // Store refresh token if available
            if let refreshToken = json["refresh_token"] as? String {
                UserDefaults.standard.set(refreshToken, forKey: "refresh_token")
            }

            // Ensure profile exists on backend
            try? await ensureProfile()
        }
    }

    func refreshSession() async throws {
        guard let refreshToken = UserDefaults.standard.string(forKey: "refresh_token") else {
            signOut()
            throw APIError.unauthorized
        }

        let url = URL(string: "\(supabaseURL)/auth/v1/token?grant_type=refresh_token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "refresh_token": refreshToken
        ])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode < 400 else {
            signOut()
            throw APIError.unauthorized
        }

        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
           let newToken = json["access_token"] as? String {
            self.accessToken = newToken
            UserDefaults.standard.set(newToken, forKey: "access_token")

            if let newRefresh = json["refresh_token"] as? String {
                UserDefaults.standard.set(newRefresh, forKey: "refresh_token")
            }
        } else {
            signOut()
            throw APIError.unauthorized
        }
    }

    func signOut() {
        accessToken = nil
        userEmail = nil
        isAuthenticated = false
        UserDefaults.standard.removeObject(forKey: "access_token")
        UserDefaults.standard.removeObject(forKey: "user_email")
        UserDefaults.standard.removeObject(forKey: "refresh_token")
    }

    private func ensureProfile() async throws {
        let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000"
        let url = URL(string: "\(baseURL)/api/auth/ensure-profile")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode < 400 else {
            return
        }
    }
}
