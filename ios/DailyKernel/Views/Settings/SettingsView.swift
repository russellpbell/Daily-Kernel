import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authService: AuthService
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
                let granted = await notificationService.requestPermission()
                if granted {
                    notificationService.scheduleDailyReminder(hour: 8, minute: 0)
                } else {
                    notificationsEnabled = false
                }
            }
        } else {
            notificationService.cancelDailyReminder()
        }
    }
}
