import SwiftUI

struct CardStackView: View {
    @Binding var cards: [Card]
    @Binding var savedCardIds: Set<String>
    var onSwipe: (Card, SwipeDirection) -> Void

    @State private var dragOffset: CGSize = .zero
    @State private var dragDirection: SwipeDirection?

    private let swipeThreshold: CGFloat = 80

    var body: some View {
        ZStack {
            ForEach(Array(cards.prefix(3).enumerated().reversed()), id: \.element.id) { index, card in
                BriefingCardView(
                    card: card,
                    isSaved: savedCardIds.contains(card.id)
                )
                .zIndex(Double(3 - index))
                .scaleEffect(scaleForIndex(index))
                .offset(y: offsetYForIndex(index))
                .offset(index == 0 ? dragOffset : .zero)
                .rotationEffect(
                    index == 0
                        ? .degrees(Double(dragOffset.width) / 20)
                        : .zero
                )
                .overlay(
                    index == 0 ? swipeIndicatorOverlay : nil
                )
                .gesture(
                    index == 0 ? dragGesture : nil
                )
                .animation(.spring(response: 0.4, dampingFraction: 0.8), value: dragOffset)
            }
        }
        .frame(height: 420)
    }

    // MARK: - Stacking

    private func scaleForIndex(_ index: Int) -> CGFloat {
        let base: CGFloat = 1.0
        return base - CGFloat(index) * 0.05
    }

    private func offsetYForIndex(_ index: Int) -> CGFloat {
        CGFloat(index) * 10
    }

    // MARK: - Swipe Indicator Overlay

    @ViewBuilder
    private var swipeIndicatorOverlay: some View {
        ZStack {
            // Learned (right)
            if dragOffset.width > 30 {
                VStack {
                    HStack {
                        Spacer()
                        Text("LEARNED")
                            .font(.title3.bold())
                            .foregroundStyle(.green)
                            .padding(10)
                            .background(Color.green.opacity(0.2))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.green, lineWidth: 2)
                            )
                            .rotationEffect(.degrees(-15))
                            .padding()
                    }
                    Spacer()
                }
                .transition(.opacity)
            }

            // Skip (left)
            if dragOffset.width < -30 {
                VStack {
                    HStack {
                        Text("SKIP")
                            .font(.title3.bold())
                            .foregroundStyle(.red)
                            .padding(10)
                            .background(Color.red.opacity(0.2))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.red, lineWidth: 2)
                            )
                            .rotationEffect(.degrees(15))
                            .padding()
                        Spacer()
                    }
                    Spacer()
                }
                .transition(.opacity)
            }

            // Save (up)
            if dragOffset.height < -30 {
                VStack {
                    Spacer()
                    Text("SAVE")
                        .font(.title3.bold())
                        .foregroundStyle(.blue)
                        .padding(10)
                        .background(Color.blue.opacity(0.2))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.blue, lineWidth: 2)
                        )
                        .padding(.bottom, 20)
                }
                .transition(.opacity)
            }
        }
        .animation(.easeOut(duration: 0.15), value: dragOffset)
    }

    // MARK: - Drag Gesture

    private var dragGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                dragOffset = value.translation
                if abs(value.translation.width) > abs(value.translation.height) {
                    dragDirection = value.translation.width > 0 ? .right : .left
                } else if value.translation.height < 0 {
                    dragDirection = .up
                }
            }
            .onEnded { value in
                let horizontalAmount = value.translation.width
                let verticalAmount = value.translation.height

                if horizontalAmount > swipeThreshold {
                    // Swipe right -> Learned
                    completeSwipe(direction: .right)
                } else if horizontalAmount < -swipeThreshold {
                    // Swipe left -> Skip
                    completeSwipe(direction: .left)
                } else if verticalAmount < -swipeThreshold {
                    // Swipe up -> Save
                    completeSwipe(direction: .up)
                } else {
                    // Snap back
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        dragOffset = .zero
                        dragDirection = nil
                    }
                }
            }
    }

    private func completeSwipe(direction: SwipeDirection) {
        guard let card = cards.first else { return }

        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()

        let exitOffset: CGSize
        switch direction {
        case .right:
            exitOffset = CGSize(width: 500, height: 0)
        case .left:
            exitOffset = CGSize(width: -500, height: 0)
        case .up:
            exitOffset = CGSize(width: 0, height: -600)
        }

        withAnimation(.easeOut(duration: 0.3)) {
            dragOffset = exitOffset
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            dragOffset = .zero
            dragDirection = nil
            if !cards.isEmpty {
                cards.removeFirst()
            }
            onSwipe(card, direction)
        }
    }
}
