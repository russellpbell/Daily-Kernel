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
                                .foregroundStyle(.primary)

                            HeatmapView(completions: completions)
                        }
                        .padding(.horizontal)

                        // Expertise
                        if !expertise.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Expertise")
                                    .font(.headline)
                                    .foregroundStyle(.primary)

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
        .navigationTitle("Progress")
        .navigationBarTitleDisplayMode(.large)
        .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "Something went wrong")
        }
        .task {
            await loadStats()
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
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(
                ZStack {
                    Color.orange.opacity(streak.currentStreak > 0 ? 0.06 : 0)
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(.ultraThinMaterial)
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(Color.glassBorder, lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(0.12), radius: 8, y: 4)

            // Longest streak
            VStack(spacing: 8) {
                HStack(spacing: 4) {
                    Image(systemName: "trophy.fill")
                        .font(.title2)
                        .foregroundStyle(.yellow)
                        .symbolRenderingMode(.hierarchical)
                    Text("\(streak.longestStreak)")
                        .font(.title.bold().monospacedDigit())
                        .foregroundStyle(.yellow)
                        .contentTransition(.numericText())
                }

                Text("Longest Streak")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(
                ZStack {
                    Color.yellow.opacity(streak.longestStreak > 0 ? 0.06 : 0)
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(.ultraThinMaterial)
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(Color.glassBorder, lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(0.12), radius: 8, y: 4)
        }
        .padding(.horizontal)
        .accessibilityElement(children: .contain)
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
