import SwiftUI

struct BriefingView: View {
    @State private var cards: [Card] = []
    @State private var reviewedCount = 0
    @State private var totalCount = 0
    @State private var isLoading = true
    @State private var isGenerating = false
    @State private var errorMessage: String?
    @State private var showError = false
    @State private var briefingComplete = false
    @State private var showSwipeHint = true
    @State private var savedCardIds: Set<String> = []
    @State private var showFeed = false
    @State private var confettiVisible = false
    @State private var loadTask: Task<Void, Never>?
    @State private var feedbackError: String?

    private let api = APIClient.shared

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                if isLoading {
                    loadingSkeleton
                } else if briefingComplete {
                    completionView
                } else if cards.isEmpty {
                    emptyState
                } else {
                    briefingContent
                }
            }
            .navigationTitle("Daily Kernel")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarRight) {
                    Button {
                        showFeed = true
                    } label: {
                        Label("Feed", systemImage: "list.bullet")
                            .foregroundStyle(Color.appPrimaryLight)
                    }
                }
            }
            .sheet(isPresented: $showFeed) {
                NavigationStack {
                    InterestFeedView()
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "Something went wrong")
            }
            .alert("Error", isPresented: .init(
                get: { feedbackError != nil },
                set: { if !$0 { feedbackError = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(feedbackError ?? "Something went wrong")
            }
            .task {
                loadTask = Task { await loadBriefing() }
                await loadTask?.value
            }
            .onDisappear {
                loadTask?.cancel()
            }
        }
    }

    // MARK: - Briefing Content

    private var briefingContent: some View {
        VStack(spacing: 20) {
            // Progress bar
            VStack(spacing: 6) {
                HStack {
                    Text("Progress")
                        .font(.caption)
                        .foregroundStyle(.gray)
                    Spacer()
                    Text("\(reviewedCount)/\(totalCount)")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.gray)
                }

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.appSurface)
                            .frame(height: 8)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(
                                LinearGradient(
                                    colors: [Color.appPrimary, Color.appPrimaryLight],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(
                                width: totalCount > 0
                                    ? geo.size.width * CGFloat(reviewedCount) / CGFloat(totalCount)
                                    : 0,
                                height: 8
                            )
                            .animation(.spring(response: 0.4), value: reviewedCount)
                    }
                }
                .frame(height: 8)
            }
            .padding(.horizontal)

            // Swipe hint
            if showSwipeHint && !cards.isEmpty {
                HStack(spacing: 16) {
                    Label("Skip", systemImage: "arrow.left")
                        .foregroundStyle(.red.opacity(0.8))
                    Label("Save", systemImage: "arrow.up")
                        .foregroundStyle(.blue.opacity(0.8))
                    Label("Learned", systemImage: "arrow.right")
                        .foregroundStyle(.green.opacity(0.8))
                }
                .font(.caption)
                .padding(.vertical, 8)
                .padding(.horizontal, 16)
                .background(Color.appSurface.opacity(0.8))
                .cornerRadius(20)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            // Card stack
            Spacer()

            CardStackView(
                cards: $cards,
                savedCardIds: $savedCardIds,
                onSwipe: handleSwipe
            )
            .padding(.horizontal)

            Spacer()

            // Action buttons
            FeedbackButtonsView(
                onSkip: { skipTopCard() },
                onSave: { saveTopCard() },
                onLearned: { learnedTopCard() }
            )
            .padding(.bottom, 8)
        }
        .padding(.top, 8)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 24) {
            Image(systemName: "sparkles")
                .font(.system(size: 60))
                .foregroundStyle(Color.appPrimary)

            Text("No briefing yet")
                .font(.title2.bold())
                .foregroundStyle(.white)

            Text("Generate your daily knowledge briefing to get started")
                .font(.subheadline)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Button(action: generateBriefing) {
                HStack {
                    if isGenerating {
                        ProgressView()
                            .tint(.white)
                    }
                    Text("Generate Briefing")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.appPrimary)
                .foregroundStyle(.white)
                .cornerRadius(12)
            }
            .disabled(isGenerating)
            .padding(.horizontal, 40)
        }
    }

    // MARK: - Completion View

    private var completionView: some View {
        VStack(spacing: 24) {
            ZStack {
                if confettiVisible {
                    ForEach(0..<20, id: \.self) { i in
                        ConfettiPiece(index: i)
                    }
                }

                VStack(spacing: 16) {
                    Text("\u{1F389}")
                        .font(.system(size: 72))
                        .scaleEffect(confettiVisible ? 1.0 : 0.5)
                        .animation(.spring(response: 0.5, dampingFraction: 0.6), value: confettiVisible)

                    Text("Briefing Complete!")
                        .font(.title.bold())
                        .foregroundStyle(.white)

                    Text("You reviewed all \(totalCount) cards today")
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                }
            }

            Button {
                showFeed = true
            } label: {
                HStack {
                    Image(systemName: "list.bullet")
                    Text("View Interest Feed")
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.appSurface)
                .foregroundStyle(Color.appPrimaryLight)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.appSurfaceLight, lineWidth: 1)
                )
            }
            .padding(.horizontal, 40)

            Button(action: {
                Task { await loadBriefing() }
            }) {
                Text("Refresh")
                    .foregroundStyle(Color.appPrimaryLight)
            }
            .frame(height: 44)
        }
        .onAppear {
            withAnimation(.spring(response: 0.6)) {
                confettiVisible = true
            }
        }
    }

    // MARK: - Loading Skeleton

    private var loadingSkeleton: some View {
        VStack(spacing: 20) {
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.appSurface)
                .frame(height: 8)
                .padding(.horizontal)

            RoundedRectangle(cornerRadius: 20)
                .fill(Color.appSurface)
                .frame(height: 400)
                .padding(.horizontal, 20)
                .shimmer()

            HStack(spacing: 40) {
                Circle()
                    .fill(Color.appSurface)
                    .frame(width: 56, height: 56)
                Circle()
                    .fill(Color.appSurface)
                    .frame(width: 56, height: 56)
                Circle()
                    .fill(Color.appSurface)
                    .frame(width: 56, height: 56)
            }
        }
    }

    // MARK: - Actions

    private func loadBriefing() async {
        isLoading = true
        errorMessage = nil
        do {
            let response: BriefingWrapper = try await api.getTodayBriefing()
            if let briefing = response.briefing, let briefingCards = briefing.cards {
                let pending = briefingCards.filter { $0.feedback == nil }
                let reviewed = briefingCards.count - pending.count
                cards = pending
                reviewedCount = reviewed
                totalCount = briefingCards.count
                briefingComplete = pending.isEmpty && briefingCards.count > 0

                if reviewed > 0 {
                    showSwipeHint = false
                }
            } else {
                cards = []
                totalCount = 0
                reviewedCount = 0
                briefingComplete = false
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }

    private func generateBriefing() {
        Task {
            isGenerating = true
            errorMessage = nil
            do {
                let response: GenerateWrapper = try await api.generateBriefing()
                if let briefingCards = response.briefing.cards {
                    cards = briefingCards
                    totalCount = briefingCards.count
                    reviewedCount = 0
                    briefingComplete = false
                }
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isGenerating = false
        }
    }

    private func handleSwipe(card: Card, direction: SwipeDirection) {
        // Process feedback
        switch direction {
        case .right:
            sendFeedback(card: card, action: "thumbs_up")
        case .left:
            sendFeedback(card: card, action: "thumbs_down")
        case .up:
            saveCard(card)
            sendFeedback(card: card, action: "skip")
        }

        // Remove card from array (single source of truth)
        withAnimation {
            cards.removeAll { $0.id == card.id }
        }
        reviewedCount += 1

        if showSwipeHint {
            withAnimation { showSwipeHint = false }
        }

        if cards.isEmpty {
            withAnimation(.spring(response: 0.5)) {
                briefingComplete = true
            }
        }
    }

    private func sendFeedback(card: Card, action: String) {
        Task {
            do {
                try await api.sendFeedback(cardId: card.id, action: action)
            } catch {
                feedbackError = "Couldn't save your response. It'll sync next time."
            }
        }
    }

    private func saveCard(_ card: Card) {
        savedCardIds.insert(card.id)
        Task {
            do {
                try await api.saveToReadingList(data: [
                    "card_id": card.id,
                    "title": card.title,
                    "summary": card.summary,
                    "source_url": card.sourceUrl ?? "",
                    "source_name": card.sourceName ?? "",
                    "category_name": card.categoryName
                ])
            } catch {
                feedbackError = "Couldn't save card. It'll sync next time."
            }
        }
    }

    private func skipTopCard() {
        guard let card = cards.first else { return }
        handleSwipe(card: card, direction: .left)
    }

    private func saveTopCard() {
        guard let card = cards.first else { return }
        handleSwipe(card: card, direction: .up)
    }

    private func learnedTopCard() {
        guard let card = cards.first else { return }
        handleSwipe(card: card, direction: .right)
    }
}

// MARK: - Confetti Piece

private struct ConfettiPiece: View {
    let index: Int
    @State private var animate = false

    private let colors: [Color] = [.red, .green, .blue, .yellow, .purple, .orange, .pink, .cyan]

    var body: some View {
        Circle()
            .fill(colors[index % colors.count])
            .frame(width: CGFloat.random(in: 6...10), height: CGFloat.random(in: 6...10))
            .offset(
                x: animate ? CGFloat.random(in: -150...150) : 0,
                y: animate ? CGFloat.random(in: -200...100) : 0
            )
            .opacity(animate ? 0 : 1)
            .onAppear {
                withAnimation(
                    .easeOut(duration: Double.random(in: 1.0...2.0))
                        .delay(Double.random(in: 0...0.3))
                ) {
                    animate = true
                }
            }
    }
}

// MARK: - Shimmer Modifier

extension View {
    func shimmer() -> some View {
        modifier(ShimmerModifier())
    }
}

private struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .overlay(
                LinearGradient(
                    colors: [
                        .clear,
                        Color.white.opacity(0.05),
                        .clear
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .offset(x: phase)
                .onAppear {
                    withAnimation(
                        .linear(duration: 1.5)
                        .repeatForever(autoreverses: false)
                    ) {
                        phase = 400
                    }
                }
            )
            .clipped()
    }
}

enum SwipeDirection {
    case left, right, up
}
