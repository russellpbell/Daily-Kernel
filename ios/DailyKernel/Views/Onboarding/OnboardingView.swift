import SwiftUI

// MARK: - Topic Suggestion Model

private struct TopicSuggestion: Identifiable {
    let id = UUID()
    let name: String
    let sourceType: String
    let icon: String
}

private let topicSuggestions: [TopicSuggestion] = [
    TopicSuggestion(name: "AI", sourceType: "stem", icon: "cpu"),
    TopicSuggestion(name: "Climate", sourceType: "news", icon: "leaf.fill"),
    TopicSuggestion(name: "Genomics", sourceType: "biomedical", icon: "dna"),
    TopicSuggestion(name: "Space", sourceType: "stem", icon: "sparkles"),
    TopicSuggestion(name: "Neuroscience", sourceType: "biomedical", icon: "brain.head.profile"),
    TopicSuggestion(name: "Physics", sourceType: "stem", icon: "atom"),
    TopicSuggestion(name: "Economics", sourceType: "academic", icon: "chart.line.uptrend.xyaxis"),
    TopicSuggestion(name: "Machine Learning", sourceType: "curriculum", icon: "brain"),
    TopicSuggestion(name: "Health", sourceType: "biomedical", icon: "heart.fill"),
    TopicSuggestion(name: "Statistics", sourceType: "curriculum", icon: "function"),
]

// MARK: - Onboarding View

struct OnboardingView: View {
    @Binding var isComplete: Bool
    @State private var currentPage = 0
    @State private var selectedTopics: Set<String> = []
    @State private var isCreatingCategories = false
    @State private var errorMessage: String?

    private let totalPages = 4

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            TabView(selection: $currentPage) {
                WelcomePage()
                    .tag(0)
                HowItWorksPage()
                    .tag(1)
                TopicPickerPage(
                    selectedTopics: $selectedTopics,
                    isLoading: $isCreatingCategories
                )
                .tag(2)
                ReadyPage(onGetStarted: completeOnboarding)
                    .tag(3)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut(duration: 0.3), value: currentPage)

            // Custom page indicator + navigation
            VStack {
                Spacer()

                // Error banner
                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundColor(.red)
                        .padding(.horizontal, 24)
                        .padding(.bottom, 8)
                        .transition(.opacity)
                }

                // Page dots
                HStack(spacing: 8) {
                    ForEach(0..<totalPages, id: \.self) { i in
                        Circle()
                            .fill(i == currentPage ? Color.appPrimary : Color.white.opacity(0.2))
                            .frame(
                                width: i == currentPage ? 8 : 6,
                                height: i == currentPage ? 8 : 6
                            )
                            .animation(.spring(response: 0.3), value: currentPage)
                    }
                }
                .padding(.bottom, 16)

                // Navigation buttons
                HStack {
                    if currentPage < 2 {
                        Button("Skip") {
                            withAnimation { currentPage = 2 }
                        }
                        .foregroundColor(.secondary)
                        .frame(minHeight: 44)
                    } else {
                        Spacer()
                    }

                    Spacer()

                    if currentPage < totalPages - 1 {
                        Button {
                            if currentPage == 2 {
                                Task { await saveTopics() }
                            } else {
                                withAnimation { currentPage += 1 }
                            }
                        } label: {
                            HStack(spacing: 4) {
                                if isCreatingCategories {
                                    ProgressView()
                                        .tint(.white)
                                        .scaleEffect(0.8)
                                } else {
                                    Text(currentPage == 2 ? "Continue" : "Next")
                                    Image(systemName: "arrow.right")
                                }
                            }
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(Color.appPrimary)
                            .clipShape(Capsule())
                        }
                        .disabled(
                            (currentPage == 2 && selectedTopics.isEmpty) || isCreatingCategories
                        )
                        .opacity(currentPage == 2 && selectedTopics.isEmpty ? 0.4 : 1)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 32)
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Actions

    private func saveTopics() async {
        isCreatingCategories = true
        errorMessage = nil

        let api = APIClient.shared
        let selected = topicSuggestions.filter { selectedTopics.contains($0.name) }

        do {
            for topic in selected {
                let _: CategoryResponse = try await api.request(
                    path: "/api/categories",
                    method: "POST",
                    body: ["name": topic.name, "source_type": topic.sourceType]
                )
            }
            withAnimation { currentPage = 3 }
        } catch {
            errorMessage = "Failed to save topics. Please try again."
        }

        isCreatingCategories = false
    }

    private func completeOnboarding() {
        UserDefaults.standard.set(true, forKey: "onboarding_complete")
        withAnimation(.easeInOut(duration: 0.4)) {
            isComplete = true
        }
    }
}

// MARK: - Page 1: Welcome

private struct WelcomePage: View {
    @State private var emojiScale: CGFloat = 0.5
    @State private var emojiOpacity: Double = 0
    @State private var titleOpacity: Double = 0
    @State private var subtitleOpacity: Double = 0

    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                colors: [
                    Color(hex: "1e1b4b"),
                    Color.appBackground,
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                Text("\u{1F331}")
                    .font(.system(size: 80))
                    .scaleEffect(emojiScale)
                    .opacity(emojiOpacity)

                VStack(spacing: 12) {
                    Text("Daily Kernel")
                        .font(.system(size: 36, weight: .bold, design: .default))
                        .foregroundColor(.white)
                        .opacity(titleOpacity)

                    Text("Keep up with your field,\na few minutes a day.")
                        .font(.title3)
                        .foregroundColor(.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .opacity(subtitleOpacity)
                }

                Spacer()
                Spacer()
            }
            .padding(.horizontal, 32)
        }
        .onAppear {
            withAnimation(.spring(response: 0.8, dampingFraction: 0.6).delay(0.2)) {
                emojiScale = 1.0
                emojiOpacity = 1.0
            }
            withAnimation(.easeOut(duration: 0.6).delay(0.5)) {
                titleOpacity = 1.0
            }
            withAnimation(.easeOut(duration: 0.6).delay(0.8)) {
                subtitleOpacity = 1.0
            }
        }
    }
}

// MARK: - Page 2: How It Works

private struct HowItWorksPage: View {
    @State private var row1Visible = false
    @State private var row2Visible = false
    @State private var row3Visible = false

    private struct FeatureRow: View {
        let icon: String
        let title: String
        let subtitle: String
        let isVisible: Bool

        var body: some View {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(Color.appPrimaryLight)
                    .frame(width: 44, height: 44)
                    .background(Color.appPrimary.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.6))
                }

                Spacer()
            }
            .padding(.horizontal, 8)
            .opacity(isVisible ? 1 : 0)
            .offset(y: isVisible ? 0 : 20)
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(alignment: .leading, spacing: 12) {
                Text("How It Works")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.bottom, 8)
                    .padding(.horizontal, 8)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 24)

            VStack(spacing: 28) {
                FeatureRow(
                    icon: "newspaper.fill",
                    title: "Your daily briefing",
                    subtitle: "Research and news, summarized into cards",
                    isVisible: row1Visible
                )

                FeatureRow(
                    icon: "brain.head.profile",
                    title: "It learns with you",
                    subtitle: "Content adapts as your expertise grows",
                    isVisible: row2Visible
                )

                FeatureRow(
                    icon: "bookmark.fill",
                    title: "Save what matters",
                    subtitle: "Build a reading list of papers to revisit",
                    isVisible: row3Visible
                )
            }
            .padding(.horizontal, 24)
            .padding(.top, 32)

            Spacer()
            Spacer()
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.5).delay(0.2)) {
                row1Visible = true
            }
            withAnimation(.easeOut(duration: 0.5).delay(0.45)) {
                row2Visible = true
            }
            withAnimation(.easeOut(duration: 0.5).delay(0.7)) {
                row3Visible = true
            }
        }
    }
}

// MARK: - Page 3: Topic Picker

private struct TopicPickerPage: View {
    @Binding var selectedTopics: Set<String>
    @Binding var isLoading: Bool
    @State private var appeared = false

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(spacing: 8) {
                Text("What are you interested in?")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)

                Text("Pick a few topics to get started")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.5))
            }
            .padding(.horizontal, 24)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)

            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(Array(topicSuggestions.enumerated()), id: \.element.id) { index, topic in
                    TopicChip(
                        topic: topic,
                        isSelected: selectedTopics.contains(topic.name),
                        delay: Double(index) * 0.05,
                        appeared: appeared
                    ) {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            if selectedTopics.contains(topic.name) {
                                selectedTopics.remove(topic.name)
                            } else {
                                selectedTopics.insert(topic.name)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 24)

            Text("You can always change these later")
                .font(.footnote)
                .foregroundColor(.white.opacity(0.35))
                .opacity(appeared ? 1 : 0)

            Spacer()
            Spacer()
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.5).delay(0.15)) {
                appeared = true
            }
        }
    }
}

private struct TopicChip: View {
    let topic: TopicSuggestion
    let isSelected: Bool
    let delay: Double
    let appeared: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 8) {
                Image(systemName: topic.icon)
                    .font(.subheadline)
                Text(topic.name)
                    .font(.subheadline.weight(.medium))
            }
            .foregroundColor(isSelected ? .white : .white.opacity(0.7))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(isSelected ? Color.appPrimary : Color.white.opacity(0.06))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .strokeBorder(
                        isSelected ? Color.appPrimary : Color.white.opacity(0.12),
                        lineWidth: 1
                    )
            )
            .scaleEffect(isSelected ? 1.03 : 1.0)
        }
        .buttonStyle(.plain)
        .opacity(appeared ? 1 : 0)
        .offset(y: appeared ? 0 : 15)
        .animation(.easeOut(duration: 0.4).delay(delay + 0.2), value: appeared)
    }
}

// MARK: - Page 4: Ready

private struct ReadyPage: View {
    let onGetStarted: () -> Void
    @State private var checkmarkScale: CGFloat = 0.3
    @State private var checkmarkOpacity: Double = 0
    @State private var textOpacity: Double = 0
    @State private var buttonOpacity: Double = 0
    @State private var isGenerating = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 72))
                .foregroundStyle(Color.appPrimary)
                .scaleEffect(checkmarkScale)
                .opacity(checkmarkOpacity)

            VStack(spacing: 12) {
                Text("You\u{2019}re all set.")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)

                Text("Your first briefing is being prepared.")
                    .font(.body)
                    .foregroundColor(.white.opacity(0.6))
                    .multilineTextAlignment(.center)
            }
            .opacity(textOpacity)

            Spacer()

            Button {
                Task { await getStarted() }
            } label: {
                HStack(spacing: 8) {
                    if isGenerating {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(0.85)
                    }
                    Text(isGenerating ? "Preparing..." : "Get Started")
                        .font(.headline)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.appPrimary)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .disabled(isGenerating)
            .opacity(buttonOpacity)
            .padding(.horizontal, 24)

            Spacer()
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.5).delay(0.2)) {
                checkmarkScale = 1.0
                checkmarkOpacity = 1.0
            }
            withAnimation(.easeOut(duration: 0.5).delay(0.6)) {
                textOpacity = 1.0
            }
            withAnimation(.easeOut(duration: 0.5).delay(0.9)) {
                buttonOpacity = 1.0
            }
        }
    }

    private func getStarted() async {
        isGenerating = true
        do {
            _ = try await APIClient.shared.generateBriefing()
        } catch {
            // Non-blocking: proceed even if generation fails.
            // The briefing view will handle retry on its own.
        }
        isGenerating = false
        onGetStarted()
    }
}

// MARK: - Preview

#Preview {
    OnboardingView(isComplete: .constant(false))
}
