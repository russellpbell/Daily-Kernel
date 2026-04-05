import SwiftUI

struct FeedbackButtonsView: View {
    var onSkip: () -> Void
    var onSave: () -> Void
    var onLearned: () -> Void

    var body: some View {
        HStack(spacing: 20) {
            FeedbackButton(
                icon: "xmark",
                label: "Skip",
                tint: .red,
                action: onSkip
            )

            FeedbackButton(
                icon: "bookmark",
                label: "Read Later",
                tint: .blue,
                action: onSave
            )
            .scaleEffect(0.9)

            FeedbackButton(
                icon: "lightbulb.fill",
                label: "Learned",
                tint: .green,
                action: onLearned
            )
        }
        .padding(.horizontal, 20)
    }
}

struct FeedbackButton: View {
    let icon: String
    let label: String
    let tint: Color
    let action: () -> Void

    @State private var tapCount = 0

    var body: some View {
        Button {
            tapCount += 1
            action()
        } label: {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .medium))
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(tint)
                    .frame(width: 56, height: 56)
                    .background(
                        ZStack {
                            tint.opacity(0.12)
                            Circle().fill(.ultraThinMaterial)
                        }
                    )
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .strokeBorder(tint.opacity(0.2), lineWidth: 0.5)
                    )

                Text(label)
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.secondary)
            }
        }
        .buttonStyle(FeedbackScaleButtonStyle())
        .sensoryFeedback(.impact(weight: .light), trigger: tapCount)
        .accessibilityLabel(label)
    }
}

private struct FeedbackScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.9 : 1.0)
            .animation(.spring(response: 0.2), value: configuration.isPressed)
    }
}
