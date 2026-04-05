import SwiftUI

struct ExpertiseCardView: View {
    let expertise: UserExpertise

    private var categoryColors: (Color, Color) {
        CategoryColors.forCategory(expertise.categoryName)
    }

    private var progressToNextLevel: Double {
        // Approximate progress based on cards reviewed per level threshold
        let thresholds = [0, 10, 30, 60, 100, 200]
        let currentThreshold = expertise.level < thresholds.count ? thresholds[expertise.level - 1] : 0
        let nextThreshold = expertise.level < thresholds.count - 1 ? thresholds[expertise.level] : thresholds.last ?? 200
        let range = nextThreshold - currentThreshold
        guard range > 0 else { return 1.0 }
        let progress = Double(expertise.cardsReviewed - currentThreshold) / Double(range)
        return min(max(progress, 0), 1.0)
    }

    private var levelColor: Color {
        switch expertise.level {
        case 1: return .gray
        case 2: return .blue
        case 3: return .green
        case 4: return .orange
        case 5: return .purple
        default: return .gray
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                // Category name
                Text(expertise.categoryName)
                    .font(.headline)
                    .foregroundStyle(.white)

                Spacer()

                // Level badge
                Text(expertise.levelLabel)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(levelColor)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(levelColor.opacity(0.15))
                    .cornerRadius(10)
            }

            // Progress bar
            VStack(alignment: .leading, spacing: 4) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.appSurface)
                            .frame(height: 6)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(
                                LinearGradient(
                                    colors: [categoryColors.0, categoryColors.1],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geo.size.width * progressToNextLevel, height: 6)
                    }
                }
                .frame(height: 6)

                if expertise.level < 5 {
                    Text("Progress to \(nextLevelLabel)")
                        .font(.caption2)
                        .foregroundStyle(.gray)
                }
            }

            // Stats row
            HStack(spacing: 20) {
                HStack(spacing: 4) {
                    Image(systemName: "doc.text")
                        .font(.caption2)
                        .foregroundStyle(.gray)
                    Text("\(expertise.topicsCovered) topics")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }

                HStack(spacing: 4) {
                    Image(systemName: "rectangle.stack")
                        .font(.caption2)
                        .foregroundStyle(.gray)
                    Text("\(expertise.cardsReviewed) cards")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.appSurface.opacity(0.7))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(categoryColors.0.opacity(0.3), lineWidth: 1)
                )
        )
    }

    private var nextLevelLabel: String {
        let labels = ["Beginner", "Familiar", "Intermediate", "Advanced", "Expert"]
        let nextIndex = min(expertise.level, labels.count - 1)
        return labels[nextIndex]
    }
}
