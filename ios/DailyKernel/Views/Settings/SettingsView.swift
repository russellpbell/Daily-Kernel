import SwiftUI
import UserNotifications

struct SettingsView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var storeService: StoreKitService
    @StateObject private var notificationService = NotificationService.shared

    @State private var userName = ""
    @State private var userEmail = ""
    @State private var cardsPerBriefing = 10
    @State private var apiBaseURL = ""
    @State private var notificationsEnabled = false
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showError = false
    @State private var showSignOutConfirm = false
    @State private var saveSuccess = false
    @State private var showNotificationDeniedAlert = false
    @State private var subscriptionStatus: String?
    @State private var subscriptionPlan: String?
    @State private var saveCount = 0

    private let api = APIClient.shared

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            if isLoading {
                LoadingView(message: "Loading settings...")
            } else {
                Form {
                    // Profile section
                    Section {
                        HStack {
                            Label("Email", systemImage: "envelope")
                                .foregroundStyle(.secondary)
                                .symbolRenderingMode(.hierarchical)
                            Spacer()
                            Text(userEmail)
                                .foregroundStyle(.primary.opacity(0.7))
                        }
                        .listRowBackground(Color.clear)

                        HStack {
                            Label("Name", systemImage: "person")
                                .foregroundStyle(.secondary)
                                .symbolRenderingMode(.hierarchical)
                            TextField("Your name", text: $userName)
                                .multilineTextAlignment(.trailing)
                                .foregroundStyle(.primary)
                        }
                        .listRowBackground(Color.clear)
                    } header: {
                        Text("Profile")
                    }

                    // Briefing section
                    Section {
                        Stepper(value: $cardsPerBriefing, in: 5...25) {
                            HStack {
                                Label("Cards per briefing", systemImage: "rectangle.stack")
                                    .foregroundStyle(.secondary)
                                    .symbolRenderingMode(.hierarchical)
                                Spacer()
                                Text("\(cardsPerBriefing)")
                                    .font(.body.monospacedDigit())
                                    .foregroundStyle(Color.appPrimaryLight)
                                    .contentTransition(.numericText())
                            }
                        }
                        .listRowBackground(Color.clear)
                        .sensoryFeedback(.selection, trigger: cardsPerBriefing)
                    } header: {
                        Text("Briefing")
                    }

                    // Notifications section
                    Section {
                        Toggle(isOn: $notificationsEnabled) {
                            Label("Push Notifications", systemImage: "bell.badge")
                                .foregroundStyle(.secondary)
                                .symbolRenderingMode(.hierarchical)
                        }
                        .tint(Color.appPrimary)
                        .listRowBackground(Color.clear)
                        .onChange(of: notificationsEnabled) { _, newValue in
                            handleNotificationToggle(newValue)
                        }
                    } header: {
                        Text("Notifications")
                    }

                    // Subscription section
                    Section {
                        HStack {
                            Label("Plan", systemImage: "creditcard")
                                .foregroundStyle(.secondary)
                                .symbolRenderingMode(.hierarchical)
                            Spacer()
                            if storeService.hasFreePass {
                                Text("Free Pass")
                                    .font(.caption.bold())
                                    .foregroundStyle(.green)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.green.opacity(0.15))
                                    .background(.ultraThinMaterial)
                                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                            } else if let plan = subscriptionPlan {
                                Text(plan == "monthly" ? "Monthly" : plan == "annual" ? "Annual" : plan.capitalized)
                                    .foregroundStyle(.primary.opacity(0.7))
                            } else {
                                Text("None")
                                    .foregroundStyle(.primary.opacity(0.5))
                            }
                        }
                        .listRowBackground(Color.clear)

                        HStack {
                            Label("Status", systemImage: "checkmark.seal")
                                .foregroundStyle(.secondary)
                                .symbolRenderingMode(.hierarchical)
                            Spacer()
                            if let status = subscriptionStatus {
                                let displayText = statusDisplayText(status)
                                let displayColor = statusColor(status)
                                Text(displayText)
                                    .foregroundStyle(displayColor)
                                    .fontWeight(.medium)
                            } else {
                                Text("Not subscribed")
                                    .foregroundStyle(.primary.opacity(0.5))
                            }
                        }
                        .listRowBackground(Color.clear)

                        if !storeService.hasFreePass {
                            Button {
                                Task {
                                    await storeService.restorePurchases()
                                }
                            } label: {
                                HStack {
                                    Spacer()
                                    Text("Restore Purchases")
                                        .foregroundStyle(Color.appPrimaryLight)
                                    Spacer()
                                }
                            }
                            .listRowBackground(Color.clear)
                            .accessibilityLabel("Restore previous purchases")
                        }
                    } header: {
                        Text("Subscription")
                    }

                    // Developer section
                    Section {
                        HStack {
                            Label("API URL", systemImage: "server.rack")
                                .foregroundStyle(.secondary)
                                .symbolRenderingMode(.hierarchical)
                            TextField("http://localhost:3000", text: $apiBaseURL)
                                .multilineTextAlignment(.trailing)
                                .foregroundStyle(.primary)
                                .font(.caption)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        }
                        .listRowBackground(Color.clear)
                    } header: {
                        Text("Developer")
                    }

                    // Save button
                    Section {
                        Button {
                            saveSettings()
                        } label: {
                            HStack {
                                Spacer()
                                if isSaving {
                                    ProgressView()
                                        .tint(.white)
                                } else if saveSuccess {
                                    HStack(spacing: 6) {
                                        Image(systemName: "checkmark.circle.fill")
                                            .symbolRenderingMode(.hierarchical)
                                        Text("Saved")
                                    }
                                    .foregroundStyle(.green)
                                } else {
                                    Text("Save Changes")
                                        .fontWeight(.semibold)
                                        .foregroundStyle(.white)
                                }
                                Spacer()
                            }
                        }
                        .disabled(isSaving)
                        .listRowBackground(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(Color.appPrimary.opacity(isSaving ? 0.5 : 1))
                        )
                        .sensoryFeedback(.success, trigger: saveCount)
                        .accessibilityLabel(isSaving ? "Saving" : saveSuccess ? "Changes saved" : "Save changes")
                    }

                    // Sign out
                    Section {
                        Button(role: .destructive) {
                            showSignOutConfirm = true
                        } label: {
                            HStack {
                                Spacer()
                                Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                                    .fontWeight(.medium)
                                Spacer()
                            }
                        }
                        .listRowBackground(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(Color.red.opacity(0.15))
                        )
                        .accessibilityLabel("Sign out of Daily Kernel")
                    }

                    // App info
                    Section {
                        HStack {
                            Label("Version", systemImage: "info.circle")
                                .foregroundStyle(.secondary)
                                .symbolRenderingMode(.hierarchical)
                            Spacer()
                            Text(appVersion)
                                .foregroundStyle(.tertiary)
                        }
                        .listRowBackground(Color.clear)
                    } footer: {
                        Text("Daily Kernel - Your daily knowledge briefing")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                            .frame(maxWidth: .infinity)
                            .padding(.top, 16)
                    }
                }
                .formStyle(.grouped)
                .scrollContentBackground(.hidden)
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.large)
        .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "Something went wrong")
        }
        .alert("Notifications Disabled", isPresented: $showNotificationDeniedAlert) {
            Button("Open Settings") {
                if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(settingsURL)
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Notification permission was denied. Please enable notifications in the Settings app to receive daily briefing reminders.")
        }
        .confirmationDialog(
            "Sign out of Daily Kernel?",
            isPresented: $showSignOutConfirm,
            titleVisibility: .visible
        ) {
            Button("Sign Out", role: .destructive) {
                authService.signOut()
            }
            Button("Cancel", role: .cancel) {}
        }
        .task {
            await loadSettings()
        }
    }

    // MARK: - Helpers

    private func statusDisplayText(_ status: String) -> String {
        switch status {
        case "active": return "Active"
        case "free_pass": return "Active"
        case "canceled": return "Canceled"
        case "past_due": return "Past Due"
        default: return status.capitalized
        }
    }

    private func statusColor(_ status: String) -> Color {
        switch status {
        case "active", "free_pass": return .green
        case "canceled": return .orange
        default: return .red
        }
    }

    private var appVersion: String {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(version) (\(build))"
    }

    private func loadSettings() async {
        isLoading = true
        do {
            let response = try await api.getSettings()
            userName = response.user.name
            userEmail = response.user.email
            cardsPerBriefing = response.user.cardsPerBriefing
            apiBaseURL = api.baseURL
            notificationsEnabled = notificationService.isPermissionGranted
        } catch {
            userEmail = authService.userEmail ?? ""
            apiBaseURL = api.baseURL
            errorMessage = error.localizedDescription
            showError = true
        }

        // Load subscription status
        do {
            let subResponse = try await api.getSubscriptionStatus()
            subscriptionStatus = subResponse.status
            subscriptionPlan = subResponse.plan
        } catch {
            // Non-critical, use store service state
            if storeService.hasFreePass {
                subscriptionStatus = "free_pass"
                subscriptionPlan = "free_pass"
            } else if storeService.isSubscribed {
                subscriptionStatus = "active"
            }
        }

        isLoading = false
    }

    private func saveSettings() {
        Task {
            isSaving = true
            saveSuccess = false
            do {
                let _ = try await api.updateSettings(updates: [
                    "name": userName,
                    "cards_per_briefing": cardsPerBriefing
                ])
                saveSuccess = true
                saveCount += 1

                try? await Task.sleep(for: .seconds(2))
                saveSuccess = false
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isSaving = false
        }
    }

    private func handleNotificationToggle(_ enabled: Bool) {
        if enabled {
            Task {
                // Check current system permission status first
                await notificationService.checkPermissionStatus()
                let settings = await UNUserNotificationCenter.current().notificationSettings()

                if settings.authorizationStatus == .denied {
                    notificationsEnabled = false
                    showNotificationDeniedAlert = true
                    return
                }

                let granted = await notificationService.requestPermission()
                if granted {
                    notificationService.scheduleDailyReminder(hour: 8, minute: 0)
                } else {
                    notificationsEnabled = false
                    showNotificationDeniedAlert = true
                }
            }
        } else {
            notificationService.cancelDailyReminder()
        }
    }
}
