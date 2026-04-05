import SwiftUI

struct StreakBadge: View {
    let count: Int
    @State private var animateFlame = false

    var body: some View {
        HStack(spacing: 4) {
            Text("\u{1F525}")
                .font(.title2)
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
        }
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
