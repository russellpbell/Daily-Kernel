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

    private let api = APIClient.shared

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                if isLoading {
                    LoadingView(message: "Loading settings...")
                } else {
                    Form {
                        // Profile section
                        Section {
                            HStack {
                                Text("Email")
                                    .foregroundStyle(.gray)
                                Spacer()
                                Text(userEmail)
                                    .foregroundStyle(.white.opacity(0.7))
                            }
                            .listRowBackground(Color.appSurface)

                            HStack {
                                Text("Name")
                                    .foregroundStyle(.gray)
                                TextField("Your name", text: $userName)
                                    .multilineTextAlignment(.trailing)
                                    .foregroundStyle(.white)
                            }
                            .listRowBackground(Color.appSurface)
                        } header: {
                            Text("Profile")
                        }

                        // Briefing section
                        Section {
                            Stepper(value: $cardsPerBriefing, in: 5...25) {
                                HStack {
                                    Text("Cards per briefing")
                                        .foregroundStyle(.gray)
                                    Spacer()
                                    Text("\(cardsPerBriefing)")
                                        .font(.body.monospacedDigit())
                                        .foregroundStyle(Color.appPrimaryLight)
                                }
                            }
                            .listRowBackground(Color.appSurface)
                        } header: {
                            Text("Briefing")
                        }

                        // Notifications section
                        Section {
                            Toggle(isOn: $notificationsEnabled) {
                                Text("Push Notifications")
                                    .foregroundStyle(.gray)
                            }
                            .tint(Color.appPrimary)
                            .listRowBackground(Color.appSurface)
                            .onChange(of: notificationsEnabled) { _, newValue in
                                handleNotificationToggle(newValue)
                            }
                        } header: {
                            Text("Notifications")
                        }

                        // Subscription section
                        Section {
                            HStack {
                                Text("Plan")
                                    .foregroundStyle(.gray)
                                Spacer()
                                if storeService.hasFreePass {
                                    Text("Free Pass")
                                        .font(.caption.bold())
                                        .foregroundStyle(.green)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 3)
                                        .background(Color.green.opacity(0.15))
                                        .cornerRadius(6)
                                } else if let plan = subscriptionPlan {
                                    Text(plan == "monthly" ? "Monthly" : plan == "annual" ? "Annual" : plan.capitalized)
                                        .foregroundStyle(.white.opacity(0.7))
                                } else {
                                    Text("None")
                                        .foregroundStyle(.white.opacity(0.5))
                                }
                            }
                            .listRowBackground(Color.appSurface)

                            HStack {
                                Text("Status")
                                    .foregroundStyle(.gray)
                                Spacer()
                                if let status = subscriptionStatus {
                                    Text(status == "active" ? "Active" : status == "free_pass" ? "Active" : status == "canceled" ? "Canceled" : status == "past_due" ? "Past Due" : status.capitalized)
                                        .foregroundStyle(status == "active" || status == "free_pass" ? .green : status == "canceled" ? .orange : .red)
                                } else {
                                    Text("Not subscribed")
                                        .foregroundStyle(.white.opacity(0.5))
                                }
                            }
                            .listRowBackground(Color.appSurface)

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
                                .listRowBackground(Color.appSurface)
                            }
                        } header: {
                            Text("Subscription")
                        }

                        // Developer section
                        Section {
                            HStack {
                                Text("API URL")
                                    .foregroundStyle(.gray)
                                TextField("http://localhost:3000", text: $apiBaseURL)
                                    .multilineTextAlignment(.trailing)
                                    .foregroundStyle(.white)
                                    .font(.caption)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                            }
                            .listRowBackground(Color.appSurface)
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
                            .listRowBackground(Color.appPrimary.opacity(isSaving ? 0.5 : 1))
                        }

                        // Sign out
                        Section {
                            Button(role: .destructive) {
                                showSignOutConfirm = true
                            } label: {
                                HStack {
                                    Spacer()
                                    Text("Sign Out")
                                        .fontWeight(.medium)
                                    Spacer()
                                }
                            }
                            .listRowBackground(Color.red.opacity(0.15))
                        }

                        // App info
                        Section {
                            HStack {
                                Text("Version")
                                    .foregroundStyle(.gray)
                                Spacer()
                                Text(appVersion)
                                    .foregroundStyle(.gray.opacity(0.7))
                            }
                            .listRowBackground(Color.appSurface)
                        } footer: {
                            Text("Daily Kernel - Your daily knowledge briefing")
                                .font(.caption2)
                                .foregroundStyle(.gray.opacity(0.5))
                                .frame(maxWidth: .infinity)
                                .padding(.top, 16)
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
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
                let generator = UINotificationFeedbackGenerator()
                generator.notificationOccurred(.success)

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
                    // Permission was previously denied at the system level;
                    // requestPermission() won't show a prompt again.
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
