import SwiftUI

struct StreakBadge: View {
    let count: Int
    @State private var animateFlame = false

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "flame.fill")
                .font(.title2)
                .foregroundStyle(
                    count > 0
                        ? LinearGradient(
                            colors: [.orange, .red],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                        : LinearGradient(
                            colors: [.gray, .gray],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                )
                .symbolRenderingMode(.hierarchical)
                .scaleEffect(animateFlame ? 1.15 : 1.0)
                .animation(
                    count > 0
                        ? .easeInOut(duration: 0.8).repeatForever(autoreverses: true)
                        : .default,
                    value: animateFlame
                )

            Text("\(count)")
                .font(.title.bold().monospacedDigit())
                .foregroundStyle(count > 0 ? .orange : .gray)
                .contentTransition(.numericText())
        }
        .accessibilityLabel("\(count) day streak")
        .onAppear {
            if count > 0 {
                animateFlame = true
            }
        }
        .onChange(of: count) { _, newValue in
            animateFlame = newValue > 0
        }
    }
}
