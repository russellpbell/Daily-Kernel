import SwiftUI

struct FeedbackButtonsView: View {
    var onSkip: () -> Void
    var onSave: () -> Void
    var onLearned: () -> Void

    var body: some View {
        HStack(spacing: 40) {
            // Skip
            FeedbackButton(
                icon: "xmark",
                label: "Skip",
                color: .red,
                action: onSkip
            )

            // Read Later
            FeedbackButton(
                icon: "bookmark",
                label: "Read Later",
                color: .blue,
                action: onSave
            )

            // Learned
            FeedbackButton(
                icon: "lightbulb.fill",
                label: "Learned",
                color: .green,
                action: onLearned
            )
        }
        .padding(.horizontal, 20)
    }
}

private struct FeedbackButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void

    @State private var isPressed = false

    var body: some View {
        Button {
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            action()
        } label: {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(color)
                    .frame(width: 56, height: 56)
                    .background(color.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .scaleEffect(isPressed ? 0.9 : 1.0)

                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.gray)
            }
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

private struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.9 : 1.0)
            .animation(.spring(response: 0.2), value: configuration.isPressed)
    }
}
