import Foundation
import UserNotifications

@MainActor
class NotificationService: ObservableObject {
    static let shared = NotificationService()

    @Published var isPermissionGranted = false
    @Published var deviceToken: String?

    private let notificationCenter = UNUserNotificationCenter.current()

    private init() {
        Task {
            await checkPermissionStatus()
        }
    }

    func checkPermissionStatus() async {
        let settings = await notificationCenter.notificationSettings()
        isPermissionGranted = settings.authorizationStatus == .authorized
    }

    func requestPermission() async -> Bool {
        do {
            let granted = try await notificationCenter.requestAuthorization(
                options: [.alert, .badge, .sound]
            )
            isPermissionGranted = granted
            return granted
        } catch {
            isPermissionGranted = false
            return false
        }
    }

    func handleDeviceToken(_ tokenData: Data) {
        let token = tokenData.map { String(format: "%02x", $0) }.joined()
        deviceToken = token

        Task {
            await registerTokenWithServer(token: token)
        }
    }

    func handleFailedRegistration(_ error: Error) {
        deviceToken = nil
    }

    private func registerTokenWithServer(token: String) async {
        do {
            try await APIClient.shared.request(
                path: "/api/settings",
                method: "PATCH",
                body: ["device_token": token, "platform": "ios"]
            ) as UserProfileResponse
        } catch {
            // Silently fail - device token registration is non-critical
        }
    }

    // MARK: - Local Notification Scheduling

    func scheduleDailyReminder(hour: Int, minute: Int) {
        // Remove any existing daily reminders
        notificationCenter.removePendingNotificationRequests(
            withIdentifiers: ["daily_briefing_reminder"]
        )

        let content = UNMutableNotificationContent()
        content.title = "Your Daily Briefing is Ready"
        content.body = "Tap to review today's knowledge cards."
        content.sound = .default
        content.badge = 1

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(
            dateMatching: dateComponents,
            repeats: true
        )

        let request = UNNotificationRequest(
            identifier: "daily_briefing_reminder",
            content: content,
            trigger: trigger
        )

        notificationCenter.add(request) { error in
            if let error = error {
                print("Failed to schedule daily reminder: \(error.localizedDescription)")
            }
        }
    }

    func cancelDailyReminder() {
        notificationCenter.removePendingNotificationRequests(
            withIdentifiers: ["daily_briefing_reminder"]
        )
    }

    func clearBadge() {
        let content = UNMutableNotificationContent()
        content.badge = 0
        let request = UNNotificationRequest(
            identifier: "clear_badge",
            content: content,
            trigger: nil
        )
        notificationCenter.add(request)
    }
}
