import SwiftUI

struct StatsView: View {
    @State private var streak = Streak(currentStreak: 0, longestStreak: 0, lastReviewDate: nil)
    @State private var completions: [DailyCompletion] = []
    @State private var expertise: [UserExpertise] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showError = false

    private let api = APIClient.shared

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                if isLoading {
                    LoadingView(message: "Loading stats...")
                } else {
                    ScrollView {
                        VStack(spacing: 24) {
                            // Streak cards
                            streakSection

                            // Heatmap
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Activity")
                                    .font(.headline)
                                    .foregroundStyle(.white)

                                HeatmapView(completions: completions)
                            }
                            .padding(.horizontal)

                            // Expertise
                            if !expertise.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Expertise")
                                        .font(.headline)
                                        .foregroundStyle(.white)

                                    ForEach(expertise) { exp in
                                        ExpertiseCardView(expertise: exp)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        .padding(.vertical, 16)
                    }
                    .refreshable {
                        await loadStats()
                    }
                }
            }
            .navigationTitle("Stats")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "Something went wrong")
            }
            .task {
                await loadStats()
            }
        }
    }

    // MARK: - Streak Section

    private var streakSection: some View {
        HStack(spacing: 16) {
            // Current streak
            VStack(spacing: 8) {
                StreakBadge(count: streak.currentStreak)

                Text("Current Streak")
                    .font(.caption)
                    .foregroundStyle(.gray)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(Color.appSurface)
            .cornerRadius(16)

            // Longest streak
            VStack(spacing: 8) {
                HStack(spacing: 4) {
                    Text("\u{1F3C6}")
                        .font(.title2)
                    Text("\(streak.longestStreak)")
                        .font(.title.bold().monospacedDigit())
                        .foregroundStyle(.yellow)
                }

                Text("Longest Streak")
                    .font(.caption)
                    .foregroundStyle(.gray)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(Color.appSurface)
            .cornerRadius(16)
        }
        .padding(.horizontal)
    }

    // MARK: - Data

    private func loadStats() async {
        isLoading = true
        do {
            async let statsRequest = api.getStats()
            async let knowledgeRequest = api.getKnowledge()

            let statsResponse = try await statsRequest
            let knowledgeResponse = try await knowledgeRequest

            streak = statsResponse.streak
            completions = statsResponse.completions
            expertise = knowledgeResponse.expertise
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }
}
